# Project templates

The project template will have installed everything you need 
to start building a v14 package. there are just a couple of 
things you need to know.

## When need to build your assets.

switching to the `XStatic14.Client/assets` folder, you 
can run a command to compile your typescript files
and put them in the wwwroot folder.

```
npm run build
```

will build them once,

# use 'watch' to get dynamic reloading on changes.

```
npm run watch
```

will watch for changes, when you make a change to a .ts file
it will recompile and place in the `wwwroot/app_plugins` folder.

the client package is a Razor Class Library (RCL) so the website
will dynamically reload when it detects changes in the folder. 

If you have your brower dev tools opem this will reload the site
with the new javascript. and you will see your changes.
