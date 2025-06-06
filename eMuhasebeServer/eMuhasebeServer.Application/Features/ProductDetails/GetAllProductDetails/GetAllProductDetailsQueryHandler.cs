﻿using eMuhasebeServer.Domain.Entities;
using eMuhasebeServer.Domain.Repositories;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TS.Result;

namespace eMuhasebeServer.Application.Features.ProductDetails.GetAllProductDetails;

internal sealed class GetAllProductDetailsQueryHandler(
    IProductRepository productRepository) : IRequestHandler<GetAllProductDetailsQuery, Result<Product>>
{
    public async Task<Result<Product>> Handle(GetAllProductDetailsQuery request, CancellationToken cancellationToken)
    {
        Product? product = 
            await productRepository
            .Where(P=>P.Id == request.ProductId)
            .Include(P => P.Details)
            .FirstOrDefaultAsync(cancellationToken);

        if (product is null)
        {
            return Result<Product>.Failure("Ürün bulunamadı");
        }

        return product;
    }
}