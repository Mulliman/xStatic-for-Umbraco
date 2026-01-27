using System;
using System.IO;

class Program {
    static void Main() {
        Directory.CreateDirectory("test_wwwroot");
        var d = new DirectoryInfo("test_wwwroot");
        try {
            var files = d.GetFiles("assets/*.css", SearchOption.AllDirectories);
            Console.WriteLine("Files found: " + files.Length);
        } catch (Exception e) {
            Console.WriteLine("Exception: " + e.Message);
        }
    }
}
