using System;
using System.Collections.Generic;

List<string> fields = null;
try {
    foreach(var f in fields) {
        Console.WriteLine(f);
    }
} catch (Exception e) {
    Console.WriteLine(e.Message);
}
