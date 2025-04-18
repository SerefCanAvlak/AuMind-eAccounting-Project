﻿using eMuhasebeServer.Domain.Entities;
using eMuhasebeServer.Domain.Enum;
using eMuhasebeServer.Domain.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace eMuhasebeServer.Infrastructure.Context;

internal sealed class CompanyDbContext : DbContext, IUnitOfWorkCompany
{
    private string connectionString = string.Empty;

    public CompanyDbContext(Company company)
    {
        CreateConnectionStringWithCompany(company);
    }

    public CompanyDbContext(IHttpContextAccessor httpContextAccessor, ApplicationDbContext context)
    {
        CreateConnectionString(httpContextAccessor, context);

    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(connectionString);
    }

    public DbSet<CashRegister> CashRegisters { get; set; }
    public DbSet<CashRegisterDetail> CashRegisterDetails { get; set; }
    public DbSet<Bank> Banks { get; set; }
    public DbSet<BankDetail> BankDetails { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        #region CashRegister
        modelBuilder.Entity<CashRegister>().Property(p => p.DepositAmount).HasColumnType("money");
        modelBuilder.Entity<CashRegister>().Property(p => p.WithdrawalAmount).HasColumnType("money");
        modelBuilder.Entity<CashRegister>().Property(p => p.CurrencyType).HasConversion(type => type.Value, value => CurrencyTypeEnum.FromValue(value));
        modelBuilder.Entity<CashRegister>().HasQueryFilter(filter => !filter.IsDeleted);
        modelBuilder.Entity<CashRegister>().HasMany(p => p.Details).WithOne().HasForeignKey(p => p.CashRegisterDetailId);
        #endregion

        #region CashRegisterDetail
        modelBuilder.Entity<CashRegisterDetail>().Property(p => p.DepositAmount).HasColumnType("money");
        modelBuilder.Entity<CashRegisterDetail>().Property(p => p.WithdrawalAmount).HasColumnType("money");
        modelBuilder.Entity<CashRegisterDetail>().HasQueryFilter(filter => !filter.IsDeleted);
        #endregion

        #region Bank
        modelBuilder.Entity<Bank>().Property(p => p.DepositAmount).HasColumnType("money");
        modelBuilder.Entity<Bank>().Property(p => p.WithdrawalAmount).HasColumnType("money");
        modelBuilder.Entity<Bank>().Property(p => p.CurrencyType).HasConversion(type => type.Value, value => CurrencyTypeEnum.FromValue(value));
        modelBuilder.Entity<Bank>().HasQueryFilter(filter => !filter.IsDeleted);
        modelBuilder.Entity<Bank>().HasMany(p => p.Details).WithOne().HasForeignKey(p => p.BankId);
        #endregion

        #region BankDetail
        modelBuilder.Entity<BankDetail>().Property(p => p.DepositAmount).HasColumnType("money");
        modelBuilder.Entity<BankDetail>().Property(p => p.WithdrawalAmount).HasColumnType("money");
        modelBuilder.Entity<BankDetail>().HasQueryFilter(filter => !filter.IsDeleted);
        #endregion
    }

    private void CreateConnectionString(IHttpContextAccessor httpContextAccessor, ApplicationDbContext context)
    {
        if (httpContextAccessor.HttpContext is null) return;

        string? companyId = httpContextAccessor.HttpContext.User.FindFirstValue("CompanyId");
        if (string.IsNullOrEmpty(companyId)) return;

        Company? company = context.Companies.Find(Guid.Parse(companyId));
        if (company is null) return;

        CreateConnectionStringWithCompany(company);
    }

    private void CreateConnectionStringWithCompany(Company company)
    {
        if (string.IsNullOrEmpty(company.Database.UserId))
        {
            connectionString =
                        $"Data Source={company.Database.Server};" +
                        $"Initial Catalog={company.Database.DatabaseName};" +
                        "Integrated Security=True;" +
                        "Connect Timeout=30;" +
                        "Encrypt=True;" +
                        "Trust Server Certificate=True;" +
                        "Application Intent=ReadWrite;" +
                        "Multi Subnet Failover=False";
        }
        else
        {
            connectionString =
            $"Data Source={company.Database.Server};" +
            $"Initial Catalog={company.Database.DatabaseName};" +
            "Integrated Security=False;" +
            $"UserId={company.Database.UserId};" +
            $"Password={company.Database.Password};" +
            "Connect Timeout=30;" +
            "Encrypt=True;" +
            "Trust Server Certificate=True;" +
            "Application Intent=ReadWrite;" +
            "Multi Subnet Failover=False";
        }
    }
}
