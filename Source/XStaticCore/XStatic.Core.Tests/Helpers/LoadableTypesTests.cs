using System;
using System.Linq;
using System.Reflection;
using System.Reflection.Emit;
using XStatic.Core.Generator;
using XStatic.Core.Helpers;
using Xunit;

namespace XStatic.Core.Tests.Helpers
{
    public class LoadableTypesTests
    {
        [Fact]
        public void FromAssembly_ReturnsTheTypesThatLoaded_WhenSomeCannot()
        {
            var assembly = new PartlyBrokenAssembly(typeof(LoadableTypesTests), typeof(string));

            var types = LoadableTypes.FromAssembly(assembly).ToList();

            Assert.Equal(new[] { typeof(LoadableTypesTests), typeof(string) }, types);
        }

        [Fact]
        public void FromAssemblies_SkipsDynamicAssemblies()
        {
            var dynamicAssembly = AssemblyBuilder.DefineDynamicAssembly(new AssemblyName("LoadableTypesTests.Dynamic"), AssemblyBuilderAccess.Run);
            dynamicAssembly.DefineDynamicModule("Main").DefineType("NotFinished");

            var types = LoadableTypes.FromAssemblies(new Assembly[] { dynamicAssembly, typeof(LoadableTypesTests).Assembly }).ToList();

            Assert.Contains(typeof(LoadableTypesTests), types);
            Assert.DoesNotContain(types, type => type.Assembly == dynamicAssembly);
        }

        [Fact]
        public void FromAssemblies_DoesNotThrow_WhenAnAssemblyCannotLoadAllItsTypes()
        {
            var broken = new PartlyBrokenAssembly(typeof(string));

            var types = LoadableTypes.FromAssemblies(new Assembly[] { broken, typeof(LoadableTypesTests).Assembly }).ToList();

            Assert.Contains(typeof(string), types);
            Assert.Contains(typeof(LoadableTypesTests), types);
        }

        [Fact]
        public void ImplementationsOf_ReturnsOnlyConcreteImplementations()
        {
            var generators = LoadableTypes.ImplementationsOf<IGenerator>();

            Assert.Contains(typeof(StaticHtmlSiteGenerator), generators);
            Assert.All(generators, type =>
            {
                Assert.False(type.IsInterface);
                Assert.False(type.IsAbstract);
            });
        }

        /// <summary>An assembly whose GetTypes() throws like one with a type that can't load.</summary>
        private sealed class PartlyBrokenAssembly(params Type[] loadedTypes) : Assembly
        {
            public override bool IsDynamic => false;

            public override Type[] GetTypes()
            {
                throw new ReflectionTypeLoadException(
                    loadedTypes.Append(null).ToArray(),
                    new Exception[] { new TypeLoadException("Could not load type 'Missing.Dependency'.") });
            }
        }
    }
}
