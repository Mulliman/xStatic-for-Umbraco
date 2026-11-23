using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;
using System.Linq;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Core;
using XStatic.Controllers.Attributes;
using XStatic.Core.Actions;
using XStatic.Core.App;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets.Creators;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using XStatic.Core.Models;
using XStatic.Security;

namespace XStatic.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-v1")]
    [AuthorizeNormalUser]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic/config")]
    public class XStaticConfigController(IDeployerService deployerService,
        IDeploymentTargetCreatorService deploymentTargetCreatorService,
        IExportTypeService exportTypeService,
        IExportTypeRepository repo,
        GeneratorList generatorList,
        TransformerList transformerList,
        FileNameGeneratorList fileNameGeneratorList,
        PostGenerationActionsList postGenerationActionsList,
        IOptions<XStaticGlobalSettings> globalSettings) : Controller
    {
        private readonly IDeployerService _deployerService = deployerService;
        private readonly IDeploymentTargetCreatorService _deploymentTargetCreatorService = deploymentTargetCreatorService;
        private readonly IExportTypeService _exportTypeService = exportTypeService;
        private readonly IExportTypeRepository _repo = repo;
        private readonly GeneratorList _generatorList = generatorList;
        private readonly TransformerList _transformerList = transformerList;
        private readonly FileNameGeneratorList _fileNameGeneratorList = fileNameGeneratorList;
        private readonly PostGenerationActionsList _postGenerationActionsList = postGenerationActionsList;
        private readonly XStaticGlobalSettings _globalSettings = globalSettings?.Value;

        [HttpGet("get-settings")]
        [MapToApiVersion("1.0")]
        [EndpointName("Config_GetSettings")]
        [EndpointSummary("Get xStatic runtime settings")]
        [EndpointDescription("Returns global xStatic runtime settings, such as whether xStatic user role enforcement is enabled.")]
        [ProducesResponseType(typeof(XStaticSettings), StatusCodes.Status200OK)]
        public ActionResult<XStaticSettings> GetSettings()
        {
            return new XStaticSettings
            {
                IsUsingXStaticRoles = _globalSettings?.UseXStaticUserRoles ?? false
            };
        }

        [HttpGet("get-config")]
        [MapToApiVersion("1.0")]
        [EndpointName("Config_GetConfig")]
        [EndpointSummary("Get registered xStatic extensions and export types")]
        [EndpointDescription("Returns all discovered deployers, deployment target creators, export types, generators, transformer factories, file name generators, and post-generation action types.")]
        [ProducesResponseType(typeof(XStaticConfig), StatusCodes.Status200OK)]
        public ActionResult<XStaticConfig> Get()
        {
            var deployers = _deployerService.GetDefinitions();
            var creators = _deploymentTargetCreatorService.GetDefinitions();
            var exportTypes = _exportTypeService.GetExportTypes();

            return new XStaticConfig
            {
                Deployers = deployers.Select(d => new DeployerModel(d)),
                DeploymentTargetCreators = creators.Select(c => new DeploymentTargetCreatorModel(c)),
                ExportTypes = exportTypes.Select(e => new ExportTypeModel(e)),
                Generators = _generatorList.Generators.Select(g => new Core.Models.TypeModel(g)).ToList(),
                TransformerFactories = _transformerList.TransformerListFactories.Select(g => new Core.Models.TypeModel(g)).ToList(),
                FileNameGenerators = _fileNameGeneratorList.FileNameGenerators.Select(g => new Core.Models.TypeModel(g)).ToList(),
                PostGenerationActions = _postGenerationActionsList.PostActions.Select(g => new ConfigurableTypeModel(g)).ToList()
            };
        }

        [HttpPost("create-export-type")]
        [MapToApiVersion("1.0")]
        [EndpointName("Config_CreateExportType")]
        [EndpointSummary("Create an export type")]
        [EndpointDescription("Creates a new export type combining a generator, transformer factory, and file name generator.")]
        [ProducesResponseType(typeof(ExportTypeModel), StatusCodes.Status200OK)]
        public ExportTypeModel CreateExportType([FromBody] ExportTypeUpdateModel model)
        {
            var dataModel = new ExportTypeDataModel
            {
                Name = model.Name,
                Generator = model.Generator,
                TransformerFactory = model.TransformerFactory,
                FileNameGenerator = model.FileNameGenerator
            };

            var entity = _repo.Create(dataModel);

            return new ExportTypeModel(entity);
        }

        [HttpPost("update-export-type")]
        [MapToApiVersion("1.0")]
        [EndpointName("Config_UpdateExportType")]
        [EndpointSummary("Update an export type")]
        [EndpointDescription("Updates an existing export type.")]
        [ProducesResponseType(typeof(ExportTypeModel), StatusCodes.Status200OK)]
        public ExportTypeModel UpdateExportType([FromBody] ExportTypeUpdateModel model)
        {
            var dataModel = new ExportTypeDataModel
            {
                Id = model.Id,
                Name = model.Name,
                Generator = model.Generator,
                TransformerFactory = model.TransformerFactory,
                FileNameGenerator = model.FileNameGenerator
            };

            var entity = _repo.Update(dataModel);

            return new ExportTypeModel(entity);
        }

        [HttpDelete("delete-export-type")]
        [MapToApiVersion("1.0")]
        [EndpointName("Config_DeleteExportType")]
        [EndpointSummary("Delete an export type")]
        [EndpointDescription("Deletes an export type by ID.")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public void DeleteExportType(int id)
        {
            _repo.Delete(id);
        }
    }

    public class XStaticSettings
    {
        public bool IsUsingXStaticRoles { get; set; }
    }
}