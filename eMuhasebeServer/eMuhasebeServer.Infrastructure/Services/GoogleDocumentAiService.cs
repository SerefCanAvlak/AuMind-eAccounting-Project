using eMuhasebeServer.Application.Services;
using Google.Cloud.DocumentAI.V1;
using Google.Protobuf;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace eMuhasebeServer.Infrastructure.Services;

internal sealed class GoogleDocumentAiService : IVisionService
{
    private readonly ILogger<GoogleDocumentAiService> _logger;

    private readonly string _projectId = "345140904141";
    private readonly string _location = "us";
    private readonly string _processorId = "ff7860cb2c0ec5c3";

    public GoogleDocumentAiService(ILogger<GoogleDocumentAiService> logger)
    {
        _logger = logger;
    }

    public async Task<object> ExtractTextAsync(Stream imageStream)
    {
        Environment.SetEnvironmentVariable(
            "GOOGLE_APPLICATION_CREDENTIALS",
            "C:\\Users\\softw\\OneDrive\\Masaüstü\\arcane-pipe-459911-q6-6e70afd9150c.json");

        imageStream.Position = 0;
        using var memoryStream = new MemoryStream();
        await imageStream.CopyToAsync(memoryStream);
        var imageBytes = memoryStream.ToArray();
        memoryStream.Position = 0;

        var rawDocument = new RawDocument
        {
            Content = ByteString.CopyFrom(imageBytes),
            MimeType = "image/jpeg"
        };

        var client = await DocumentProcessorServiceClient.CreateAsync();

        var name = ProcessorName.FromProjectLocationProcessor(_projectId, _location, _processorId);

        var request = new ProcessRequest
        {
            Name = name.ToString(),
            RawDocument = rawDocument
        };

        var response = await client.ProcessDocumentAsync(request);

        string? invoiceDate = null;
        string? receiverName = null;

        var details = new List<object>();

        foreach (var entity in response.Document.Entities)
        {
            _logger.LogInformation("Entity Type: {Type}, MentionText: {MentionText}, NormalizedValue: {NormalizedValue}", 
                entity.Type, entity.MentionText, JsonConvert.SerializeObject(entity.NormalizedValue));
            switch (entity.Type)
            { 
                case "invoice_date":
                    _logger.LogInformation("invoice_date MentionText: {Text}", entity.MentionText);

                    if (entity.NormalizedValue?.DateValue != null)
                    {
                        invoiceDate = $"{entity.NormalizedValue.DateValue.Year}-{entity.NormalizedValue.DateValue.Month:D2}-{entity.NormalizedValue.DateValue.Day:D2}";
                    }
                    else
                    {
                        if (DateTime.TryParse(entity.MentionText, out var parsedDate))
                        {
                            invoiceDate = parsedDate.ToString("yyyy-MM-dd");
                        }
                        else
                        {
                            invoiceDate = entity.MentionText;
                        }
                    }
                    break;

                case "receiver_name":
                    _logger.LogInformation("receiver_name: {Text}", entity.MentionText);
                    receiverName = entity.MentionText;
                    break;

                case "line_item":
                    string? description = "";
                    decimal quantity = 0;
                    decimal price = 0;
                    decimal vatRate = 0;

                    bool hasQuantity = false;
                    bool hasPrice = false;

                    foreach (var prop in entity.Properties)
                    {
                        _logger.LogInformation("Property Type: {Type}, MentionText: {MentionText}", prop.Type, prop.MentionText);
                        var propType = prop.Type?.Split('/').LastOrDefault()?.ToLower()?.Trim();

                        switch (propType)
                        {
                            case "description":
                                description = prop.MentionText?.Trim();
                                break;
                            case "quantity":
                                hasQuantity = decimal.TryParse(NormalizeNumber(prop.MentionText), out quantity);
                                break;
                            case "unit_price":
                                hasPrice = decimal.TryParse(NormalizeNumber(prop.MentionText), out price);
                                break;
                            case "vat_rate":
                                decimal.TryParse(NormalizeNumber(prop.MentionText), out vatRate);
                                break;
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(description))
                    {
                        var detailObj = new
                        {
                            productName = description,
                            quantity,
                            price,
                            vatRate
                        };
                        details.Add(detailObj);
                    }
                    break;
            }
        }

        var result = new
        {
            typeValue = 0,
            date = invoiceDate ?? "",
            customerName = receiverName ?? "",
            details = details
        };

        return result; 
    }

    private static string NormalizeNumber(string? input)
    {
        if (string.IsNullOrEmpty(input)) return "0";

        // Sayıdan geçerli karakterleri çek
        var cleaned = new string(input.Where(c => char.IsDigit(c) || c == ',' || c == '.').ToArray());

        if (cleaned.Contains(',') && cleaned.Contains('.') && cleaned.IndexOf(',') > cleaned.IndexOf('.'))
        {
            cleaned = cleaned.Replace(".", "");
        }
        else if (cleaned.Contains('.') && !cleaned.Contains(','))
        {
            cleaned = cleaned.Replace(".", ","); // Noktayı virgüle çevir
        }
        return cleaned;
    }

}
