﻿using eMuhasebeServer.Application.Services;
using eMuhasebeServer.Domain.Entities;
using eMuhasebeServer.Domain.Enum;
using eMuhasebeServer.Domain.Repositories;
using MediatR;
using TS.Result;

namespace eMuhasebeServer.Application.Features.CashRegisterDetails.CreateCashRegisterDetail;

internal sealed class CreateCashRegisterDetailCommandHandler(
    ICustomerRepository customerRepository,
    ICustomerDetailRepository customerDetailRepository,
    IBankRepository bankRepository,
    IBankDetailRepository bankDetailRepository,
    ICashRegisterRepository cashRegisterRepository,
    ICashRegisterDetailRepository cashRegisterDetailRepository,
    IUnitOfWorkCompany unitOfWorkCompany,
    ICacheService cacheService) : IRequestHandler<CreateCashRegisterDetailCommand, Result<string>>
{
    public async Task<Result<string>> Handle(CreateCashRegisterDetailCommand request, CancellationToken cancellationToken)
    {
        CashRegister cashRegister = await cashRegisterRepository.GetByExpressionWithTrackingAsync(p => p.Id ==  request.CashRegisterId, cancellationToken);

        cashRegister.DepositAmount += (request.Type == 0 ? request.Amount : 0);
        cashRegister.WithdrawalAmount += (request.Type == 1 ? request.Amount : 0);
        CashRegisterDetail cashRegisterDetail = new()
        {
            Date = request.Date,
            DepositAmount = request.Type == 0 ? request.Amount : 0,
            WithdrawalAmount = request.Type == 1 ? request.Amount : 0,
            Description = request.Description,
            CashRegisterId = request.CashRegisterId
        };

        await cashRegisterDetailRepository.AddAsync(cashRegisterDetail, cancellationToken);

        if (request.OppositeCashRegisterId is not null)
        {
            CashRegister oppositeCashRegister = await cashRegisterRepository.GetByExpressionWithTrackingAsync(p => p.Id == request.OppositeCashRegisterId, cancellationToken);

            oppositeCashRegister.DepositAmount += (request.Type == 1 ? request.OppositeAmount : 0);
            oppositeCashRegister.WithdrawalAmount += (request.Type == 0 ? request.OppositeAmount : 0);

            CashRegisterDetail oppositeCashRegisterDetail = new()
            {
                Date = request.Date,
                DepositAmount = request.Type == 1 ? request.OppositeAmount : 0,
                WithdrawalAmount = request.Type == 0 ? request.OppositeAmount : 0,
                CashRegisterDetailId = cashRegisterDetail.Id,
                Description = request.Description,
                CashRegisterId = (Guid)request.OppositeCashRegisterId
            };

            cashRegisterDetail.CashRegisterDetailId = oppositeCashRegisterDetail.Id;
            await cashRegisterDetailRepository.AddAsync(oppositeCashRegisterDetail, cancellationToken);      
        }

        if (request.OppositeBankId is not null)
        {
            Bank oppositeBank = await bankRepository.GetByExpressionWithTrackingAsync(p => p.Id == request.OppositeBankId, cancellationToken);

            oppositeBank.DepositAmount += (request.Type == 1 ? request.OppositeAmount : 0);
            oppositeBank.WithdrawalAmount += (request.Type == 0 ? request.OppositeAmount : 0);

            BankDetail oppositeBankDetail = new()
            {
                Date = request.Date,
                DepositAmount = request.Type == 1 ? request.OppositeAmount : 0,
                WithdrawalAmount = request.Type == 0 ? request.OppositeAmount : 0,
                CashRegisterDetailId = cashRegisterDetail.Id,
                Description = request.Description,
                BankId = (Guid)request.OppositeBankId
            };

            cashRegisterDetail.BankDetailId = oppositeBankDetail.Id;

            await bankDetailRepository.AddAsync(oppositeBankDetail, cancellationToken);
        }

        if (request.OppositeCustomerId is not null)
        {
            Customer customer = await customerRepository.GetByExpressionWithTrackingAsync(p => p.Id == request.OppositeCustomerId, cancellationToken);

            if (customer is null)
            {
                return Result<string>.Failure("Cari Bulunamadı");
            }

            customer.DepositAmount += request.Type == 1 ? request.Amount : 0;
            customer.WithdrawalAmount += request.Type == 1 ? request.Amount : 0;

            CustomerDetail customerDetail = new()
            {
                CustomerId = customer.Id,
                CashRegisterDetailId = cashRegisterDetail.Id,
                Date = request.Date,
                Description = request.Description,
                DepositAmount = request.Type == 1 ? request.Amount : 0,
                WithdrawalAmount = request.Type == 0 ? request.Amount : 0,
                Type = CustomerDetailTypeEnum.CashRegister
            };

            cashRegisterDetail.CustomerDetailId = customerDetail.Id;

            await customerDetailRepository.AddAsync(customerDetail, cancellationToken);

            cacheService.Remove("customers");
        }

        await unitOfWorkCompany.SaveChangesAsync(cancellationToken);

        cacheService.Remove("cashRegisters");
        cacheService.Remove("banks");

        return "Kasa hareketi başarıyla işlendi";
    }
}
