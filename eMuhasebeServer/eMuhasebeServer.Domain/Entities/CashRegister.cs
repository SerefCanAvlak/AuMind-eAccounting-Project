﻿using eMuhasebeServer.Domain.Abstractions;
using eMuhasebeServer.Domain.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace eMuhasebeServer.Domain.Entities;

public sealed class CashRegister : Entity
{
    public string Name { get; set; } = string.Empty;
    public CurrencyTypeEnum CurrencyType { get; set; } = CurrencyTypeEnum.TL;
    public decimal DepositAmount { get; set; } //Giriş
    public decimal WithdrawalAmount { get; set; } //Çıkış
    public decimal BalanceAmount { get; set; }  //Bakiye
            
}
