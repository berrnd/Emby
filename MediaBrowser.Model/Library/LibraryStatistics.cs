//myproduction-change-start
using System;

namespace MediaBrowser.Model.Library
{
	public class LibraryStatistics
	{
		public LibraryStatistics()
		{
			this.NeedsRecalculation = true;
			this.TotalRunTimeTicks = 0;
			this.NewestItemDate = DateTime.MinValue;
			this.TotalFileSize = 0;
		}

		public long? TotalRunTimeTicks { get; set; }
		public DateTime? NewestItemDate { get; set; }
		public long? TotalFileSize { get; set; }
		public long? TotalFileSizeWithRedundancy { get; set; }
		public bool NeedsRecalculation { get; set; }
	}
}
//myproduction-change-end
