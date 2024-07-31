﻿using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Core;
using Umbraco.Cms.Web.Common.Authorization;
using XStatic.Core.Actions;
using XStatic.Core.Deploy;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using XStatic.Core.Models;

namespace XStatic.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-v1")]
    [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic/config")]
    public class XStaticConfigController(IDeployerService deployerService,
        IExportTypeService exportTypeService,
        IExportTypeRepository repo,
        GeneratorList generatorList,
        TransformerList transformerList,
        FileNameGeneratorList fileNameGeneratorList,
        PostGenerationActionsList postGenerationActionsList) : Controller
    {
        private readonly IDeployerService _deployerService = deployerService;
        private readonly IExportTypeService _exportTypeService = exportTypeService;
        private readonly IExportTypeRepository _repo = repo;
        private readonly GeneratorList _generatorList = generatorList;
        private readonly TransformerList _transformerList = transformerList;
        private readonly FileNameGeneratorList _fileNameGeneratorList = fileNameGeneratorList;
        private readonly PostGenerationActionsList _postGenerationActionsList = postGenerationActionsList;

        [HttpGet("get-config")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(XStaticConfig), StatusCodes.Status200OK)]
        public ActionResult<XStaticConfig> Get()
        {
            var deployers = _deployerService.GetDefinitions();
            var exportTypes = _exportTypeService.GetExportTypes();

            return new XStaticConfig
            {
                Deployers = deployers.Select(d => new DeployerModel(d)),
                ExportTypes = exportTypes.Select(e => new ExportTypeModel(e)),
                Generators = _generatorList.Generators.Select(g => new Core.Models.TypeModel(g)).ToList(),
                TransformerFactories = _transformerList.TransformerListFactories.Select(g => new Core.Models.TypeModel(g)).ToList(),
                FileNameGenerators = _fileNameGeneratorList.FileNameGenerators.Select(g => new Core.Models.TypeModel(g)).ToList(),
                PostGenerationActions = _postGenerationActionsList.PostActions.Select(g => new ConfigurableTypeModel(g)).ToList()
            };
        }

        [HttpPost("create-export-type")]
        [MapToApiVersion("1.0")]
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
        [ProducesResponseType(StatusCodes.Status200OK)]
        public void DeleteExportType(int id)
        {
            _repo.Delete(id);
        }
    }
}