using backend.database;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var identifier = dto.EmailOrUsername.Trim();

            // 1. Kiểm tra trong bảng Customers
            var customer = await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    (c.Email != null && c.Email.ToLower() == identifier.ToLower()) ||
                    c.Phone == identifier);

            if (customer != null)
            {
                return Ok(new UserResponseDto
                {
                    Id = $"CUST-{customer.CustomerID}",
                    Role = "Customer",
                    Name = customer.FullName,
                    Email = customer.Email ?? "",
                    Phone = customer.Phone,
                    RewardPoints = customer.RewardPoints,
                    Status = "Active"
                });
            }

            // 2. Kiểm tra trong bảng Accounts & Employees (Dành cho Staff, Kitchen, Manager, Owner)
            var account = await _context.Accounts
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Username.ToLower() == identifier.ToLower());

            if (account != null && account.IsActive)
            {
                var employee = await _context.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.EmployeeID == account.EmployeeID);

                if (employee != null)
                {
                    var role = await _context.Roles
                        .AsNoTracking()
                        .FirstOrDefaultAsync(r => r.RoleID == employee.RoleID);

                    var roleName = role?.RoleName ?? "Staff";

                    return Ok(new UserResponseDto
                    {
                        Id = $"EMP-{employee.EmployeeID}",
                        Role = roleName,
                        Name = employee.FullName,
                        Email = employee.Email ?? "",
                        Phone = employee.Phone,
                        RewardPoints = 0,
                        Status = "Active"
                    });
                }
            }

            // 3. Kiểm tra bằng Email trong bảng Employees
            var empByEmail = await _context.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Email != null && e.Email.ToLower() == identifier.ToLower());

            if (empByEmail != null)
            {
                var role = await _context.Roles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.RoleID == empByEmail.RoleID);

                var roleName = role?.RoleName ?? "Staff";

                return Ok(new UserResponseDto
                {
                    Id = $"EMP-{empByEmail.EmployeeID}",
                    Role = roleName,
                    Name = empByEmail.FullName,
                    Email = empByEmail.Email ?? "",
                    Phone = empByEmail.Phone,
                    RewardPoints = 0,
                    Status = "Active"
                });
            }

            return NotFound(new { message = "Không tìm thấy tài khoản với Email hoặc Tên đăng nhập này trong CSDL!" });
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterCustomerDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var phoneExists = await _context.Customers.AnyAsync(c => c.Phone == dto.Phone.Trim());
            if (phoneExists)
            {
                return BadRequest(new { message = "Số điện thoại này đã được đăng ký!" });
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var emailExists = await _context.Customers.AnyAsync(c => c.Email != null && c.Email.ToLower() == dto.Email.Trim().ToLower());
                if (emailExists)
                {
                    return BadRequest(new { message = "Email này đã được đăng ký!" });
                }
            }

            var newCustomer = new Customer
            {
                FullName = dto.FullName.Trim(),
                Phone = dto.Phone.Trim(),
                Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
                RewardPoints = 0,
                CreatedAt = DateTime.Now
            };

            _context.Customers.Add(newCustomer);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng ký tài khoản khách hàng thành công!",
                data = new UserResponseDto
                {
                    Id = $"CUST-{newCustomer.CustomerID}",
                    Role = "Customer",
                    Name = newCustomer.FullName,
                    Email = newCustomer.Email ?? "",
                    Phone = newCustomer.Phone,
                    RewardPoints = 0,
                    Status = "Active"
                }
            });
        }
    }
}
