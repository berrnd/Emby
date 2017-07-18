//myproduction-change-start
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.IO;
using MediaBrowser.Model.Services;
using System.Collections.Generic;
using System.IO;

namespace MediaBrowser.Api.UserLibrary
{
	[Route("/Users/{UserId}/DownloadPreconfiguredKodi", "GET", Summary = "DownloadPreconfiguredKodi")]
    public class DownloadPreconfiguredKodi : IReturn
    {
        [ApiMember(Name = "UserId", Description = "User Id", IsRequired = true, DataType = "string", ParameterType = "path", Verb = "GET")]
        public string UserId { get; set; }
    }

	[Route("/Users/{UserId}/DownloadPreconfiguredKodiCheck", "GET", Summary = "DownloadPreconfiguredKodiCheck")]
	public class DownloadPreconfiguredKodiCheck : IReturn
	{
		[ApiMember(Name = "UserId", Description = "User Id", IsRequired = true, DataType = "string", ParameterType = "path", Verb = "GET")]
		public string UserId { get; set; }
	}

	[Authenticated]
    public class PreconfiguredKodiService : BaseApiService
    {
        private readonly IUserManager _userManager;
		private readonly IApplicationPaths _applicationPaths;
		private readonly IFileSystem _fileSytem;

        public PreconfiguredKodiService(IUserManager userManager, IApplicationPaths applicationPaths, IFileSystem fileSystem)
        {
            _userManager = userManager;
			_applicationPaths = applicationPaths;
			_fileSytem = fileSystem;
        }

        public object Get(DownloadPreconfiguredKodi request)
        {
			var user = _userManager.GetUserById(request.UserId);
			string kodiPackagePath = GetKodiPackagePath(user);

			var headers = new Dictionary<string, string>();
			var filename = Path.GetFileName(kodiPackagePath);
			headers["Content-Disposition"] = string.Format("attachment; filename=\"{0}\"", filename);

			return ResultFactory.GetStaticFileResult(Request, new StaticFileResultOptions
			{
				Path = GetKodiPackagePath(user),
				FileShare = FileShareMode.Read,
				ResponseHeaders = headers
			});
		}

		public object Get(DownloadPreconfiguredKodiCheck request)
		{
			var user = _userManager.GetUserById(request.UserId);
			var exists = _fileSytem.FileExists(GetKodiPackagePath(user));
			
			return ResultFactory.GetResult(exists.ToString().ToLower(), "text/plain");
		}

		private string GetKodiPackagePath(User user)
		{
			string kodiPackageFolder = _applicationPaths.ProgramSystemPath.Replace(@"\System", @"\PreconfiguredKodiPackages");
			string kodiPackagePath = Path.Combine(kodiPackageFolder, string.Format("Kodi_emby.berrnd.org_{0}.exe", user.Name));
			return kodiPackagePath;
		}
	}

	[Route("/System/DownloadPreconfiguredKodiGetVersion", "GET", Summary = "DownloadPreconfiguredKodiGetVersion")]
	public class DownloadPreconfiguredKodiGetVersion : IReturn
	{
		
	}

	public class PreconfiguredKodiServicePublic : BaseApiService
	{
		private readonly IApplicationPaths _applicationPaths;
		private readonly IFileSystem _fileSytem;

		public PreconfiguredKodiServicePublic(IApplicationPaths applicationPaths, IFileSystem fileSystem)
		{
			_applicationPaths = applicationPaths;
			_fileSytem = fileSystem;
		}

		public object Get(DownloadPreconfiguredKodiGetVersion request)
		{
			string kodiPackageFolder = _applicationPaths.ProgramSystemPath.Replace(@"\System", @"\PreconfiguredKodiPackages");
			string kodiPackageVersionFile = Path.Combine(kodiPackageFolder, "version.txt");

			string version = "1";
			if (_fileSytem.FileExists(kodiPackageVersionFile))
			{
				version = _fileSytem.ReadAllText(kodiPackageVersionFile);
			}

			return ResultFactory.GetResult(version, "text/plain");
		}
	}
}
//myproduction-change-end
