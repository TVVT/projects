# Projects
1号店Zero项目目录(Demo项目)

##项目目录
目前Zero对项目目录要求很高,需要严格按照要求的目录来建立项目,当然，我们提供了方便的方法用于快速建立项目以及页面和模块。

项目目录结构如下：
```
-Zero
-Projects
	-YourProject
		-pages
			-demo.ejs
			-demo.config.json
			-demo.data.json
		-components
			-demoModule.ejs
			-demoModule.json
		-resource
			-css
				-demo.css
			-images
			-less
				-components
					-demoModule.less
				-pages
					-demo.less
			-scripts
				-demo.js
		-layouts
```

##目录解析：
1.  项目由pages组成,即demo.ejs
2.  页面可以include模块,即demoModule.ejs
3.  每个模块拥有对应的默认数据--demoModule.json以及对应的less--demoModule.less
4.  页面引用模块的同时，模块less将会和页面less一同编译成css文件--demo.css
5.  当页面中有数据要覆盖模块默认数据的时候，使用如下：
    ``include(demoModule,pageData)``
    此时，pageData将会代替默认数据成为demoModule模块的数据

##项目初始化以及快速创建
1.  进入Projects目录并打开less监听``gulp watchless``
2.  创建一个新的项目--YourProject ``gulp new --name YourProject``
3.  创建一个新的页面--demo ``gulp newp --name YourProject:demo``
	注：如果需要项目中自动加入requirejs的代码并且异步加载页面js--demo.js，那么只需要在命令后面跟上:js，即``gulp newp --name YourProject:demo:js``
4.  创建一个新的模块--demoModule ``gulp newc --name YourProject:demoModule``