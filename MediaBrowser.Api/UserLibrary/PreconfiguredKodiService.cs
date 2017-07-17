//myproduction-change-start
using MediaBrowser.Common.Configuration;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.Services;
using System.IO;

namespace MediaBrowser.Api.UserLibrary
{
	[Route("/Users/{UserId}/DownloadPreconfiguredKodi", "GET", Summary = "DownloadPreconfiguredKodi")]
    public class DownloadPreconfiguredKodi : IReturn
    {
        [ApiMember(Name = "UserId", Description = "User Id", IsRequired = true, DataType = "string", ParameterType = "path", Verb = "GET")]
        public string UserId { get; set; }
    }

    [Authenticated]
    public class PreconfiguredKodiService : BaseApiService
    {
        private readonly IUserManager _userManager;
		private readonly IApplicationPaths _applicationPaths;

        public PreconfiguredKodiService(IUserManager userManager, IApplicationPaths applicationPaths)
        {
            _userManager = userManager;
			_applicationPaths = applicationPaths;
        }

        public object Get(DownloadPreconfiguredKodi request)
        {
			var user = _userManager.GetUserById(request.UserId);

			string kodiPackageFolder = _applicationPaths.ProgramSystemPath.Replace(@"\System", "PreconfiguredKodiPackages");
			string kodiPackagePath = Path.Combine(kodiPackageFolder, string.Format("Kodi_emby.berrnd.org_{0}.exe", user.Name));

			return ResultFactory.GetStaticFileResult(Request, kodiPackagePath).ConfigureAwait(false);
        }
    }
}
//myproduction-change-end
