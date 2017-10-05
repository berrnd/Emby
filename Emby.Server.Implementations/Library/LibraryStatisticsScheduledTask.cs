//myproduction-change-start
using MediaBrowser.Model.Tasks;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Library;
using MediaBrowser.Model.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MediaBrowser.Model.IO;
using MediaBrowser.Model.Querying;

namespace Emby.Server.Implementations.Library
{
	class LibraryStatisticsScheduledTask : IScheduledTask, IConfigurableScheduledTask
	{
		private readonly ILogger _logger;
		private readonly ILibraryManager _libraryManager;
		private readonly IFileSystem _fileSystem;

		public LibraryStatisticsScheduledTask(ILogger logger, ILibraryManager libraryManager, IFileSystem fileSystem)
		{
			_logger = logger;
			_libraryManager = libraryManager;
			_fileSystem = fileSystem;
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

		public string Key
		{
			get { return "LibraryStatistics"; }
		}

		public async Task Execute(System.Threading.CancellationToken cancellationToken, IProgress<double> progress)
		{
			if (_libraryManager.Statistics == null || _libraryManager.Statistics.NeedsRecalculation)
			{
				_libraryManager.Statistics = new LibraryStatistics();

				//Newest item date
				progress.Report(30);
				_logger.Info("Recalculating library statistics newest item date");
				var newestItemQuery = new InternalItemsQuery()
				{
					OrderBy = new[] { new Tuple<string, SortOrder>(ItemSortBy.DateCreated, SortOrder.Descending) },
					Recursive = true,
					IsMissing = false,
					Limit = 1,
					SourceTypes = new[] { SourceType.Library }
				};
				_libraryManager.Statistics.NewestItemDate = _libraryManager.GetItemsResult(newestItemQuery).Items.First().DateCreated;

				if (cancellationToken.IsCancellationRequested)
				{
					return;
				}

				//Total file size
				progress.Report(60);
				_logger.Info("Recalculating library statistics total file size");
				var totalFileSizeQuery = new InternalItemsQuery()
				{
					Recursive = true,
					SourceTypes = new[] { SourceType.Library },
					IsMissing = false
				};

				long totalFileSize = 0;
				long totalFileSizeWithRedundancy = 0;
				foreach (var item in _libraryManager.GetItemsResult(totalFileSizeQuery).Items)
				{
					if (_fileSystem.FileExists(item.Path))
					{
						FileSystemMetadata fileInfo = _fileSystem.GetFileInfo(item.Path);
						totalFileSize += fileInfo.Length;
						totalFileSizeWithRedundancy += fileInfo.Length;

						if (!item.Path.Contains(@"\ForeignMedia\"))
						{
							totalFileSizeWithRedundancy += fileInfo.Length;
						}

						//Also cache this in item here to reduce filesystem access, see Emby.Server.Implementations\Dto\DtoService.cs
						if ((item.Size == null || item.Size == 0))
						{
							item.Size = fileInfo.Length;
						}
					}
				}
				_libraryManager.Statistics.TotalFileSize = totalFileSize;
				_libraryManager.Statistics.TotalFileSizeWithRedundancy = totalFileSizeWithRedundancy;

				if (cancellationToken.IsCancellationRequested)
				{
					return;
				}

				//Total run time ticks
				progress.Report(90);
				_logger.Info("Recalculating library statistics total run time ticks");
				var totalRunTimeTicksQuery = new InternalItemsQuery()
				{
					Recursive = true,
					SourceTypes = new[] { SourceType.Library },
					IsMissing = false
				};
				_libraryManager.Statistics.TotalRunTimeTicks = _libraryManager.GetItemsResult(totalRunTimeTicksQuery).Items.Sum(x => x.RunTimeTicks);
			}
		}

		public IEnumerable<TaskTriggerInfo> GetDefaultTriggers()
		{
			return new TaskTriggerInfo[]
			{
				new TaskTriggerInfo { Type = TaskTriggerInfo.TriggerInterval, IntervalTicks = TimeSpan.FromHours(1).Ticks },
				new TaskTriggerInfo { Type = TaskTriggerInfo.TriggerStartup }
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

		public bool IsLogged
		{
			get { return true; }
		}
	}
}
//myproduction-change-end
