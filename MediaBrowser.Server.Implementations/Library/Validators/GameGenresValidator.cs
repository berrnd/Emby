﻿using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MediaBrowser.Server.Implementations.Library.Validators
{
    class GameGenresValidator
    {
        /// <summary>
        /// The _library manager
        /// </summary>
        private readonly ILibraryManager _libraryManager;

        /// <summary>
        /// The _logger
        /// </summary>
        private readonly ILogger _logger;

        public GameGenresValidator(ILibraryManager libraryManager, ILogger logger)
        {
            _libraryManager = libraryManager;
            _logger = logger;
        }

        /// <summary>
        /// Runs the specified progress.
        /// </summary>
        /// <param name="progress">The progress.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task Run(IProgress<double> progress, CancellationToken cancellationToken)
        {
            var items = _libraryManager.GetGameGenres(new InternalItemsQuery
            {
                IncludeItemTypes = new[] { typeof(Game).Name }
            })
                .Items
                .Select(i => i.Item1)
                .ToList();

            var numComplete = 0;
            var count = items.Count;

            foreach (var item in items)
            {
                try
                {
                    await item.RefreshMetadata(cancellationToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    // Don't clutter the log
                    break;
                }
                catch (Exception ex)
                {
                    _logger.ErrorException("Error refreshing {0}", ex, item.Name);
                }

                numComplete++;
                double percent = numComplete;
                percent /= count;
                percent *= 100;

                progress.Report(percent);
            }

            progress.Report(100);
        }
    }
}
