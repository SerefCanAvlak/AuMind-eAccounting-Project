﻿using eMuhasebeServer.Application.Features.Auth.Login;
using eMuhasebeServer.Application.Services;
using eMuhasebeServer.Domain.Entities;
using eMuhasebeServer.Infrastructure.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace eMuhasebeServer.Infrastructure.Services
{
    internal class JwtProvider(
        UserManager<AppUser> userManager,
        IOptions<JwtOptions> jwtOptions) : IJwtProvider
    {
        public async Task<LoginCommandResponse> CreateToken(AppUser user, Guid? companyId, List<Company> companies)
        {
            List<Claim> claims = new()
            {
                new Claim("Id", user.Id.ToString()),
                new Claim("Name", user.FullName),
                new Claim("Email", user.Email ?? string.Empty),
                new Claim("UserName", user.UserName ?? string.Empty),
                new Claim("CompanyId", companyId.ToString() ?? string.Empty),
                new Claim("Companies", JsonSerializer.Serialize(companies)),
                new Claim("IsAdmin", user.IsAdmin.ToString())
            };

            DateTime expires = DateTime.UtcNow.AddMonths(1);


            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Value.SecretKey));

            JwtSecurityToken jwtSecurityToken = new(
                issuer: jwtOptions.Value.Issuer,
                audience: jwtOptions.Value.Audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expires,
                signingCredentials: new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha512));

            JwtSecurityTokenHandler handler = new();

            string token = handler.WriteToken(jwtSecurityToken);

            string refreshToken = Guid.NewGuid().ToString();
            DateTime refreshTokenExpires = expires.AddHours(1);

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpires = refreshTokenExpires;

            await userManager.UpdateAsync(user);

            return new(token, refreshToken, refreshTokenExpires);
        }
    }
}
