﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using eMuhasebeServer.Infrastructure.Context;

#nullable disable

namespace eMuhasebeServer.Infrastructure.Migrations.CompanyDb
{
    [DbContext(typeof(CompanyDbContext))]
    partial class CompanyDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.4")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("eMuhasebeServer.Domain.Entities.CashRegister", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<int>("CurrencyType")
                        .HasColumnType("int");

                    b.Property<decimal>("DepositAmount")
                        .HasColumnType("money");

                    b.Property<bool>("IsDeleted")
                        .HasColumnType("bit");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<decimal>("WithdrawalAmount")
                        .HasColumnType("money");

                    b.HasKey("Id");

                    b.ToTable("CashRegisters");
                });

            modelBuilder.Entity("eMuhasebeServer.Domain.Entities.CashRegisterDetail", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid?>("CashRegisterDetailId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid?>("CashRegisterDetailOppositeId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("CashRegisterId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<DateOnly>("Date")
                        .HasColumnType("date");

                    b.Property<decimal>("DepositAmount")
                        .HasColumnType("money");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<bool>("IsDeleted")
                        .HasColumnType("bit");

                    b.Property<decimal>("WithdrawalAmount")
                        .HasColumnType("money");

                    b.HasKey("Id");

                    b.HasIndex("CashRegisterDetailId");

                    b.HasIndex("CashRegisterDetailOppositeId");

                    b.ToTable("CashRegisterDetails");
                });

            modelBuilder.Entity("eMuhasebeServer.Domain.Entities.CashRegisterDetail", b =>
                {
                    b.HasOne("eMuhasebeServer.Domain.Entities.CashRegister", null)
                        .WithMany("Details")
                        .HasForeignKey("CashRegisterDetailId");

                    b.HasOne("eMuhasebeServer.Domain.Entities.CashRegisterDetail", "CashRegisterDetailOpposite")
                        .WithMany()
                        .HasForeignKey("CashRegisterDetailOppositeId");

                    b.Navigation("CashRegisterDetailOpposite");
                });

            modelBuilder.Entity("eMuhasebeServer.Domain.Entities.CashRegister", b =>
                {
                    b.Navigation("Details");
                });
#pragma warning restore 612, 618
        }
    }
}
