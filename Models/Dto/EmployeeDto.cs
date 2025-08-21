namespace MyApiProject.Models.Dto
{
    public class CreateEmployeeRequest
    {
        public string SSN { get; set; } = string.Empty;
        public string Fname { get; set; } = string.Empty;
        public string Lname { get; set; } = string.Empty;
        public int Dno { get; set; }

        // Users tablosu için
        public string Username { get; set; } = string.Empty; // zorunlu
        public string? Password { get; set; } // boş bırakılırsa otomatik üretilecek
    }

    public class CreateEmployeeResponse
    {
        public string SSN { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = "employee";
        public string Password { get; set; } = string.Empty; // üretilen ya da verilen şifre
    }
}