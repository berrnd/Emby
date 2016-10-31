﻿using MediaBrowser.Common.Net;
using System.Collections.Generic;
using System.IO;
using MediaBrowser.Model.Services;

namespace MediaBrowser.Api.Playback
{
    /// <summary>
    /// Class StaticRemoteStreamWriter
    /// </summary>
    public class StaticRemoteStreamWriter : IStreamWriter, IHasHeaders
    {
        /// <summary>
        /// The _input stream
        /// </summary>
        private readonly HttpResponseInfo _response;

        /// <summary>
        /// The _options
        /// </summary>
        private readonly IDictionary<string, string> _options = new Dictionary<string, string>();

        public StaticRemoteStreamWriter(HttpResponseInfo response)
        {
            _response = response;
        }

        /// <summary>
        /// Gets the options.
        /// </summary>
        /// <value>The options.</value>
        public IDictionary<string, string> Headers
        {
            get { return _options; }
        }

        /// <summary>
        /// Writes to.
        /// </summary>
        /// <param name="responseStream">The response stream.</param>
        public void WriteTo(Stream responseStream)
        {
            using (_response)
            {
                _response.Content.CopyTo(responseStream, 819200);
            }
        }
    }
}
