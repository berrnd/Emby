﻿//myproduction-change-start
using MediaBrowser.Common.ScheduledTasks;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MediaBrowser.Server.Implementations.Channels
{
    class LibraryStatisticsScheduledTask : IScheduledTask, IConfigurableScheduledTask
    {
        private readonly ILogger _logger;
        private readonly ILibraryManager _libraryManager;

        public LibraryStatisticsScheduledTask(ILogger logger, ILibraryManager libraryManager)
        {
            _logger = logger;
            _libraryManager = libraryManager;
        }

        public string Name
        {
            get { return "Library statistics calculation"; }
        }

        public string Description
        {
            get { return "Calculates media statistics."; }
        }

        public string Category
        {
            get { return "Library"; }
        }

        public async Task Execute(System.Threading.CancellationToken cancellationToken, IProgress<double> progress)
        {
            //Newest item date
            progress.Report(30);
            if (_libraryManager.CachedNewestItemDate == null)
            {
                _logger.Info("Recalculating library statistics newest item date");
                var query = new InternalItemsQuery()
                {
                    SortBy = new string[] { "DateCreated" },
                    SortOrder = SortOrder.Descending,
                    Recursive = true,
                    IsMissing = false,
                    Limit = 1,
                    ExcludeLocationTypes = new[] { LocationType.Virtual },
                    SourceTypes = new[] { SourceType.Library }
                };

                _libraryManager.CachedNewestItemDate = _libraryManager.GetItemsResult(query).Items.First().DateCreated;
            }

            if (cancellationToken.IsCancellationRequested)
            {
                return;
            }

            //Total file size
            progress.Report(60);
            if (_libraryManager.CachedTotalFileSize == null)
            {
                _logger.Info("Recalculating library statistics total file size");
                var query = new InternalItemsQuery()
                {
                    Recursive = true,
                    ExcludeLocationTypes = new[] { LocationType.Virtual },
                    SourceTypes = new[] { SourceType.Library },
                    IsMissing = false
                };

                long totalFileSize = 0;
                foreach (var item in _libraryManager.GetItemsResult(query).Items)
                {
                    if (File.Exists(item.Path))
                    {
                        totalFileSize += new FileInfo(item.Path).Length;
                    }
                }

                _libraryManager.CachedTotalFileSize = totalFileSize;
            }

            if (cancellationToken.IsCancellationRequested)
            {
                return;
            }

            //Total run time ticks
            progress.Report(90);
            if (_libraryManager.CachedTotalRuntimeTicks == null)
            {
                _logger.Info("Recalculating library statistics total run time ticks");
                var query = new InternalItemsQuery()
                {
                    Recursive = true,
                    ExcludeLocationTypes = new[] { LocationType.Virtual },
                    SourceTypes = new[] { SourceType.Library },
                    IsMissing = false
                };

                _libraryManager.CachedTotalRuntimeTicks = _libraryManager.GetItemsResult(query).Items.Sum(x => x.RunTimeTicks);
            }

        }

        public IEnumerable<ITaskTrigger> GetDefaultTriggers()
        {
            return new ITaskTrigger[]
            {
                new IntervalTrigger{ Interval = TimeSpan.FromHours(24) }
            };
        }

        public bool IsHidden
        {
            get { return false; }
        }

        public bool IsEnabled
        {
            get { return true; }
        }
    }
}
//myproduction-change-end
