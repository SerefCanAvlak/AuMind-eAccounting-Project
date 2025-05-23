﻿using eMuhasebeServer.Domain.Abstractions;

namespace eMuhasebeServer.Domain.Entities;

public sealed class InvoiceDetail : Entity
{
    public Guid InvoiceId { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    public decimal Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal VATRate { get; set; }
}