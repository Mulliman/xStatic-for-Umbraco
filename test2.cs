using System;
using System.Collections.Generic;

public class Program {
    public static void Main() {
        List<string> Fields = null;
        var config = new Dictionary<string, string>();

        try {
            foreach(var field in Fields) {
                Console.WriteLine("hi");
            }
        } catch (Exception e) {
            Console.WriteLine(e.Message);
        }
    }
}
