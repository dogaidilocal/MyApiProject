namespace MyApiProject.Models.Dto
{
    public class LeaderDto
    {
      public string LeaderID { get; set; } = string.Empty; // SSN
      public string? FullName { get; set; }
      public int Pnumber { get; set; }
      public int Dnumber { get; set; }
      public string? UsernameForUserTable { get; set; }   // opsiyonel: users tablosunda eşleştirmek istersen
    }

    public class AssignLeaderRequest
    {
      public string LeaderSSN { get; set; } = string.Empty;
      public string? UsernameForUserTable { get; set; }   // users tablosunda role yükseltilecek kullanıcı adı
    }
}
