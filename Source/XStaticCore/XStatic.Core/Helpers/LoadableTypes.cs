using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace XStatic.Core.Helpers
{
    /// <summary>
    /// Lists types for xStatic's automatic discovery of deployers, generators, transformers, file name generators and
    /// actions, without failing when an assembly can't load all of its types.
    /// </summary>
    /// <remarks>
    /// <see cref="Assembly.GetTypes"/> throws <see cref="ReflectionTypeLoadException"/> if any type in the assembly can't
    /// be loaded, for example when it depends on a package the site doesn't have, or when the assembly is a dynamic one
    /// that is still being built (such as Castle's proxy assembly used by Moq). One such assembly anywhere in the app
    /// domain used to stop xStatic from starting. Dynamic assemblies are skipped, and from the others only the types that
    /// loaded are returned.
    /// </remarks>
    internal static class LoadableTypes
    {
        /// <summary>The loadable types of every non-dynamic assembly loaded in the current app domain.</summary>
        public static IEnumerable<Type> FromLoadedAssemblies()
        {
            return FromAssemblies(AppDomain.CurrentDomain.GetAssemblies());
        }

        /// <summary>The loadable types of the given assemblies, skipping dynamic ones.</summary>
        public static IEnumerable<Type> FromAssemblies(IEnumerable<Assembly> assemblies)
        {
            return assemblies
                .Where(assembly => !assembly.IsDynamic)
                .SelectMany(FromAssembly);
        }

        /// <summary>The types of <paramref name="assembly"/> that could be loaded.</summary>
        public static IEnumerable<Type> FromAssembly(Assembly assembly)
        {
            try
            {
                return assembly.GetTypes();
            }
            catch (ReflectionTypeLoadException ex)
            {
                return ex.Types.Where(type => type != null);
            }
        }

        /// <summary>
        /// The concrete (non-interface, non-abstract) loadable types in the app domain that implement or inherit
        /// <typeparamref name="T"/>.
        /// </summary>
        public static List<Type> ImplementationsOf<T>()
        {
            return FromLoadedAssemblies()
                .Where(type => typeof(T).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                .ToList();
        }
    }
}
