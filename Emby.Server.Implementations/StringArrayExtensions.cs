//myproduction-change-start
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Emby.Server.Implementations
{
	public static class StringArrayExtensions
	{
		public static string[] Add(this string[] array, string stringToAppend)
		{
			int n = array.Length;
			Array.Resize(ref array, n + 1);
			array[n] = stringToAppend;
			return array;
		}
	}
}
//myproduction-change-end
