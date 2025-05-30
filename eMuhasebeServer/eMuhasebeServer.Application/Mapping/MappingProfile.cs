﻿using AutoMapper;
using eMuhasebeServer.Application.Features.Auth.Register;
using eMuhasebeServer.Application.Features.Banks.CreateBank;
using eMuhasebeServer.Application.Features.Banks.UpdateBank;
using eMuhasebeServer.Application.Features.CashRegisters.CreateCashRegister;
using eMuhasebeServer.Application.Features.CashRegisters.UpdateCashRegister;
using eMuhasebeServer.Application.Features.Companies.CreateCompany;
using eMuhasebeServer.Application.Features.Companies.UpdateCompany;
using eMuhasebeServer.Application.Features.Customers.CreateCustomer;
using eMuhasebeServer.Application.Features.Customers.UpdateCutomer;
using eMuhasebeServer.Application.Features.Invoices.CreateInvoice;
using eMuhasebeServer.Application.Features.Invoices.UpdateInvoice;
using eMuhasebeServer.Application.Features.Products.CreateProduct;
using eMuhasebeServer.Application.Features.Products.UpdateProduct;
using eMuhasebeServer.Application.Features.Users.CreateUser;
using eMuhasebeServer.Application.Features.Users.UpdateUser;
using eMuhasebeServer.Domain.Entities;
using eMuhasebeServer.Domain.Enum;

namespace eMuhasebeServer.Application.Mapping
{
    public sealed class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<CreateUserCommand, AppUser>();
            CreateMap<UpdateUserCommand, AppUser>();
            CreateMap<RegisterCommand, AppUser>();

            CreateMap<CreateCompanyCommand, Company>();
            CreateMap<UpdateCompanyCommand, Company>();

            CreateMap<CreateCashRegistersCommand, CashRegister>().ForMember(member => member.CurrencyType, options =>
            {
                options.MapFrom(map => CurrencyTypeEnum.FromValue(map.CurrencyTypeValue));
            });
            CreateMap<UpdateCashRegistersCommand, CashRegister>().ForMember(member => member.CurrencyType, options =>
            {
                options.MapFrom(map => CurrencyTypeEnum.FromValue(map.CurrencyTypeValue));
            });

            CreateMap<CreateBankCommand, Bank>().ForMember(member => member.CurrencyType, options =>
            {
                options.MapFrom(map => CurrencyTypeEnum.FromValue(map.CurrencyTypeValue));
            });
            CreateMap<UpdateBankCommand, Bank>().ForMember(member => member.CurrencyType, options =>
            {
                options.MapFrom(map => CurrencyTypeEnum.FromValue(map.CurrencyTypeValue));
            });

            CreateMap<CreateCustomerCommand, Customer>().ForMember(member => member.Type, options =>
            {
                options.MapFrom(map => CustomerTypeEnum.FromValue(map.TypeValue));
            });

            CreateMap<UpdateCustomerCommand, Customer>().ForMember(member => member.Type, options =>
            {
                options.MapFrom(map => CustomerTypeEnum.FromValue(map.TypeValue));
            });

            CreateMap<CreateProductCommand, Product>();
            CreateMap<UpdateProductCommand, Product>();

            CreateMap<CreateInvoiceCommand, Invoice>()
    .ForMember(dest => dest.Type, opt => opt.MapFrom(src => InvoiceTypeEnum.FromValue(src.TypeValue)))
    .ForMember(dest => dest.Details, opt => opt.MapFrom(src => src.Details.Select(d => new InvoiceDetail
    {
        ProductId = d.ProductId,
        Quantity = d.Quantity,
        Price = d.Price,
        VATRate = d.VATRate
    }).ToList()))
    .ForMember(dest => dest.Amount, opt => opt.MapFrom(src =>
        src.Details.Sum(d => d.Quantity * d.Price * (1 + (d.VATRate / 100M)))
    ));

            CreateMap<UpdateInvoiceCommand, Invoice>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => InvoiceTypeEnum.FromValue(src.TypeValue)))
                .ForMember(dest => dest.Details, opt => opt.MapFrom(src => src.Details.Select(d => new InvoiceDetail
                {
                    ProductId = d.ProductId,
                    Quantity = d.Quantity,
                    Price = d.Price,
                    VATRate = d.VATRate
                }).ToList()))
                .ForMember(dest => dest.Amount, opt => opt.MapFrom(src =>
                    src.Details.Sum(d => d.Quantity * d.Price * (1 + (d.VATRate / 100M)))
                ));


        }
    }
}
