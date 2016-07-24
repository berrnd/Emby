//myproduction-change-start
using System;

namespace MediaBrowser.Model.Library
{
    public class LibraryStatistics
    {
        public LibraryStatistics()
        {
            this.NeedsRecalculation = true;
            this.TotalRuntimeTicks = 0;
            this.NewestItemDate = DateTime.MinValue;
            this.TotalFileSize = 0;
        }

        public long? TotalRuntimeTicks { get; set; }
        public DateTime? NewestItemDate { get; set; }
        public long? TotalFileSize { get; set; }
        public bool NeedsRecalculation { get; set; }
    }
}
//myproduction-change-end
