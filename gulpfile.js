var fs = require('fs'),
    path = require('path'),
    cp = require('child_process'),
    gulp = require('gulp'),
    watch = require('gulp-watch'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    cssmin = require('gulp-cssmin'),
    less = require('gulp-less'),
    args = require('yargs').argv,
    combine = require('gulp-util').combine,
    header = require('gulp-header'),
    sourcemaps = require('tvvt-gulp-sourcemaps'),
    os = require('os'),
    changed = require('gulp-changed');

function renameFile() {
    var p = arguments[0];
    var dirname = p.dirname;
    if (os.platform() == 'win32') {
        p.dirname = dirname.slice(0, dirname.indexOf('\\')) + '/resource/css/';
    }else{
        p.dirname = dirname.slice(0, dirname.indexOf('/')) + '/resource/css/';
    }
}

function renameProjectFile() {
    var p = arguments[0];
    var dirname = p.dirname;
    p.dirname = "";
}

/**
 * [createFile 创建一个文件]
 * @param  {[string]} path    [文件的路径]
 * @param  {[string]} content [文件的内容]
 */
function createFile(_filePath, _content, success) {
    fs.open(_filePath, "w", 0644, function(e, fd) {
        fs.write(fd, _content, 0, 'utf8', function(e) {
            if (e) throw e;
            fs.closeSync(fd);
            success && success.apply(null, [_filePath]);
        })
    });
}

//task::less
gulp.task('less', function() {
    gulp.src('**/resource/less/pages/*.less')
        .pipe(less({
            paths: ['../components/', '../../public/less/']
        }))
        .on('error', function(e) {
            console.log(e);
        })
        .pipe(rename(renameFile))
        .pipe(gulp.dest(''));
});

gulp.task('importModulesLess', function() {
    var list = [];
    gulp.src('**/pages/*.ejs')
        .pipe(changed('**/pages/**', {
            extension: '.ejs'
        }))
        .on('data', function() {
            getModules(arguments[0].contents.toString());
        })
})

//task::watch less
gulp.task('watchless', function() {
    // gulp.watch('**/resource/less/**/*.less', ['less']);
    gulp.watch('**/resource/less/**/*.less', function(info) {

        var path = info.path;
        var projectName;

        if (os.platform() == 'win32') {
            path.replace(/\\Projects\\([a-zA-Z0-9\_]+)\\/, function($1, $2) {
                projectName = $2;
            })
        }else{
            path.replace(/Projects\/([a-zA-Z0-9\_]+)\//i, function($1, $2) {
                projectName = $2;
            })
        }
        gulp.src('**/' + projectName + '/resource/less/pages/*.less')
            .pipe(less({
                paths: ['../components/', '../../public/less/','../../public/components/**/less/']
            }))
            .on('error', function(e) {
                console.log(e);
            })
            .pipe(rename(renameFile))
            .pipe(gulp.dest(''));
    });
});

//task::compress All
gulp.task('compress', function() {

    if (args.name) {
        var projectName = args.name;
        //压缩projectName下的js
        gulp.src(projectName + '/resource/scripts/*.js')
            .pipe(uglify({
                outSourceMap: false
            }))
            .pipe(rename(renameProjectFile))
            .pipe(gulp.dest('../Static/js/' + projectName));

        ////压缩projectName下的css
        gulp.src('**/resource/css/*.css')
            .pipe(cssmin())
            .pipe(rename(renameProjectFile))
            .pipe(gulp.dest('../Static/css/' + projectName));

    } else {
        //压缩所有的js
        gulp.src('**/resource/scripts/*.js')
            .pipe(uglify({
                outSourceMap: false
            }))
            .pipe(rename(renameFile))
            .pipe(gulp.dest('../Static/js'));

        //压缩所有的css
        gulp.src('**/resource/css/*.css')
            .pipe(cssmin())
            .pipe(rename(renameFile))
            .pipe(gulp.dest('../Static/css'));
    }
});

//task::new page
gulp.task('newp', function() {
    var param = args.name;
    if (!param) {
        console.error('未指定项目和页面!');
    } else {
        var arr = param.split(':');
        var projectName = arr[0];
        var pageName = arr[1];
        var useJs = arr[2];

        var projectDir = path.join(__dirname, projectName);

        fs.exists(projectDir, function(exists) {
            if (!exists) {
                console.error('没有这个项目!');
            } else {
                // 创建ejs
                fs.exists(projectDir + '/pages/' + pageName + '.ejs', function(exist) {
                    if (exist) {
                        console.error('已经存在' + pageName + '.ejs!');
                    } else {

                        fs.open(projectDir + '/pages/' + pageName + '.ejs', "w", 0644, function(e, fd) {
                            var string = '<div class="' + projectName + '_page-' + pageName + '">' + '\n' +
                                '</div>';
                            if (useJs && useJs === 'js') {
                                string += '\n\n\n';
                                string += '<script>' + '\n' +
                                    '    require.config({' + '\n' +
                                    '        baseUrl : "<%=baseUrl%>/resource/scripts/",' + '\n' +
                                    '        paths: {' + '\n' +
                                    '            "zepto": "<%=publicUrl%>/scripts/lib/zepto/zepto.min",' + '\n' +
                                    '            "fastclick" : "<%=publicUrl%>/scripts/lib/fastclick/lib/fastclick",' + '\n' +
                                    '            "domReady" : "<%=publicUrl%>/scripts/lib/domReady/domReady"' + '\n' +
                                    '        }' + '\n' +
                                    '    });' + '\n' +
                                    '\n' +
                                    '    var config = {' + '\n' +
                                    '        staticUrl:"<%=baseUrl%>",' + '\n' +
                                    '        publicUrl : "<%=publicUrl%>"' + '\n' +
                                    '    }' + '\n' +
                                    '\n' +
                                    '    require(["' + pageName + '","domReady"], function(Main,domReady) {' + '\n' +
                                    '        domReady(function () {' + '\n' +
                                    '            Main.init(config);' + '\n' +
                                    '        });' + '\n' +
                                    '    });' + '\n' +
                                    '</script>';
                            }

                            fs.write(fd, string, 0, 'utf8', function(e) {
                                if (e) throw e;
                                fs.closeSync(fd);
                            })
                        });
                    }
                });
                // 创建less
                fs.exists(projectDir + '/resource/less/pages/' + pageName + '.less', function(exist) {
                    if (exist) {
                        console.error('已经存在' + pageName + '.less！');
                    } else {
                        fs.open(projectDir + '/resource/less/pages/' + pageName + '.less', "w", 0644, function(e, fd) {
                            fs.write(fd, "@import '../../../../public/less/base.less';\n@import '../../../../public/less/common.less';\n\n\n." + projectName + "_page-" + pageName + "{\n\n}", 0, 'utf8', function(e) {
                                if (e) throw e;
                                fs.closeSync(fd);
                            })
                        });
                    }
                });

                // 创建data
                fs.exists(projectDir + '/pages/' + pageName + '.data.json', function(exist) {
                    if (exist) {
                        console.error('已经存在' + pageName + '.data.json!');
                    } else {
                        fs.open(projectDir + '/pages/' + pageName + '.data.json', "w", 0644, function(e, fd) {
                            fs.write(fd, "{}", 0, 'utf8', function(e) {
                                if (e) throw e;
                                fs.closeSync(fd);
                            });
                        });
                    }
                });

                // 创建config
                fs.exists(projectDir + '/pages/' + pageName + '.config.json', function(exist) {
                    if (exist) {
                        console.error('已经存在' + pageName + '.config.json!');
                    } else {
                        fs.open(projectDir + '/pages/' + pageName + '.config.json', "w", 0644, function(e, fd) {
                            fs.write(fd, "{}", 0, 'utf8', function(e) {
                                if (e) throw e;
                                fs.closeSync(fd);
                            });
                        });
                    }
                });

                // 创建js
                if (useJs && useJs === "js") {

                    // 创建config
                    fs.exists(projectDir + '/resource/scripts/' + pageName + '.js', function(exist) {
                        if (exist) {
                            console.error('已经存在' + pageName + '.js!');
                        } else {
                            fs.open(projectDir + '/resource/scripts/' + pageName + '.js', "w", 0644, function(e, fd) {
                                var string = "define(['zepto', 'fastclick'], function($, fc ) {" + "\n" +
                                    "    fc.attach(document.body);" + "\n" +
                                    "\n" +
                                    "    var exports = {};" + "\n" +
                                    "\n" +
                                    "    exports.init = function(config){" + "\n" +
                                    "        this.config = this.config || config;" + "\n" +
                                    "    }" + "\n" +
                                    "\n" +
                                    "    return exports;" + "\n" +
                                    "});";
                                fs.write(fd, string, 0, 'utf8', function(e) {
                                    if (e) throw e;
                                    fs.closeSync(fd);
                                });
                            });
                        }
                    });

                }

            }
        });
    }
});

//task::copy page 。 拷贝文件
gulp.task('copyp', function() {
    var param = args.name;
    if (!param) {
        console.error('未指定项目和页面!');
    } else {
        var arr = param.split(':');
        if (arr.length !== 3) {
            console.error('缺少变量');
        }

        var projectName = arr[0],
            pageName = arr[1],
            target = arr[2];

        // console.log(projectName,source,target);

        var projectDir = path.join(__dirname, projectName);
        fs.exists(projectDir, function(exists) {
            if (!exists) {
                console.error('没有这个项目!');
            } else {

                var sourceArr = [
                    projectDir + '/pages/' + pageName + '.ejs',
                    projectDir + '/resource/less/pages/' + pageName + '.less',
                    projectDir + '/pages/' + pageName + '.data.json',
                    projectDir + '/pages/' + pageName + '.config.json'
                ];

                var targetArr = [
                    projectDir + '/pages/' + target + '.ejs',
                    projectDir + '/resource/less/pages/' + target + '.less',
                    projectDir + '/pages/' + target + '.data.json',
                    projectDir + '/pages/' + target + '.config.json'
                ];

                var copyfile = function(source, target) {
                    fs.exists(source, function(exist) {
                        if (exist) {
                            cp.exec('cp ' + source + ' ' + target);
                        } else {
                            console.error('源文件不存在 ' + source);
                        }
                    });
                }

                sourceArr.forEach(function(el, index) {
                    copyfile(sourceArr[index], targetArr[index]);
                });
            }
        });
    }
});


//task::new component
gulp.task('newc', function() {
    var param = args.name;
    if (!param) {
        console.error('未指定项目和模块!');
    } else {
        var projectName = param.slice(0, param.indexOf(':'));
        var pageName = param.slice(param.indexOf(':') + 1, param.length);
        var projectDir = path.join(__dirname, projectName);
        fs.exists(projectDir, function(exists) {
            if (!exists) {
                console.error('没有这个项目!');
            } else {
                fs.exists(projectDir + '/components/' + pageName + '.ejs', function(exist) {
                    if (exist) {
                        console.error('已经存在' + pageName + '.ejs!');
                    } else {

                        fs.open(projectDir + '/components/' + pageName + '.ejs', "w", 0644, function(e, fd) {
                            fs.write(fd, '<div class="' + projectName + '_com-' + pageName + '">\n</div>', 0, 'utf8', function(e) {
                                if (e) throw e;
                                fs.closeSync(fd);
                            })
                        });
                    }
                });
                fs.exists(projectDir + '/components/' + pageName + '.json', function(exist) {
                    if (exist) {
                        console.error('已经存在' + pageName + '.json!');
                    } else {
                        fs.open(projectDir + '/components/' + pageName + '.json', "w", 0644, function(e, fd) {
                            fs.write(fd, "{}", 0, 'utf8', function(e) {
                                if (e) throw e;
                                fs.closeSync(fd);
                            });
                        });
                    }
                });
                fs.exists(projectDir + '/resource/less/components/' + pageName + '.less', function(exist) {
                    if (exist) {
                        console.error('已经存在' + pageName + '.less！');
                    } else {
                        fs.open(projectDir + '/resource/less/components/' + pageName + '.less', "w", 0644, function(e, fd) {
                            fs.write(fd, "." + projectName + "_com-" + pageName + "{\n\n}", 0, 'utf8', function(e) {
                                if (e) throw e;
                                fs.closeSync(fd);
                            })
                        });

                    }
                });
            }
        });
    }
});

gulp.task('generateConfig', function() {
    var configPath = path.join(__dirname, 'config.json');
    var config = {};
    gulp.src('**/pages/*.config.json')
        .on('data', function() {
            var configFiles = JSON.parse(arguments[0].contents.toString()),
                pageName = path.basename(arguments[0].relative, '.config.json'),
                projectName = arguments[0].relative.split('/')[0];

            if (!config.hasOwnProperty(projectName)) {
                config[projectName] = {};
            }

            if (!config[projectName].hasOwnProperty('tags')) {
                config[projectName].tags = new Array();
            }

            if (configFiles.tags) {
                configFiles.tags.forEach(function(o, index) {
                    if (!hasProperty(config[projectName].tags, o)) {
                        config[projectName].tags.push(o);
                    };
                    if (config[projectName].hasOwnProperty(o)) {
                        config[projectName][o].push(pageName);
                    } else {
                        config[projectName][o] = new Array();
                        config[projectName][o].push(pageName);
                    }
                })
                var configFile = fs.openSync(configPath, 'w', 0666);
                fs.writeSync(configFile, JSON.stringify(config));
            };
        })
})

gulp.task('new', function() {
    var projectName = args.name;
    var infoPath = path.join(__dirname, projectName);
    if (fs.existsSync(infoPath)) {
        console.log('project ' + projectName + ' already exist');
    } else {
        fs.mkdirSync(infoPath, 0777);
        console.log('create folder ' + infoPath + '...');
        fs.mkdirSync(infoPath + '/pages', 0777);
        console.log('create folder ' + infoPath + '/pages ...');
        fs.mkdirSync(infoPath + '/components', 0777);
        console.log('create folder ' + infoPath + '/components ...');
        fs.mkdirSync(infoPath + '/resource', 0777);
        console.log('create folder ' + infoPath + '/resource ...');
        fs.mkdirSync(infoPath + '/resource/css', 0777);
        console.log('create folder ' + infoPath + '/resource/css ...');
        fs.mkdirSync(infoPath + '/resource/scripts', 0777);
        console.log('create folder ' + infoPath + '/resource/scripts ...');
        fs.mkdirSync(infoPath + '/resource/less', 0777);
        fs.mkdirSync(infoPath + '/resource/less/pages', 0777);
        fs.mkdirSync(infoPath + '/resource/less/components', 0777);
        console.log('create folder ' + infoPath + '/resource/less ...');
        fs.mkdirSync(infoPath + '/resource/images', 0777);
        console.log('create folder ' + infoPath + '/resource/images ...');
        fs.mkdirSync(infoPath + '/layouts', 0777);
        console.log('project inited !');
        // 创建element.less
        createFile(infoPath + '/resource/less/element.less', '');
    }
});


//task::new js
gulp.task('newjs', function() {
    var param = args.name;
    if (!param) {
        console.error('未指定项目和页面!');
    } else {
        var arr = param.split(':');
        var projectName = arr[0];
        var jsName = arr[1];
        var useJs = arr[2];

        var projectDir = path.join(__dirname, projectName);

        fs.exists(projectDir, function(exists) {
            if (!exists) {
                console.error('没有这个项目!');
            } else {

                // 创建config
                fs.exists(projectDir + '/resource/scripts/' + jsName + '.js', function(exist) {
                    if (exist) {
                        console.error('已经存在' + jsName + '.js!');
                    } else {
                        fs.open(projectDir + '/resource/scripts/' + jsName + '.js', "w", 0644, function(e, fd) {
                            var string = "define([], function( ) {" + "\n" +
                                "\n" +
                                "    var exports = {};" + "\n" +
                                "\n" +
                                "    exports.init = function(){" + "\n" +
                                "   }" + "\n" +
                                "\n" +
                                "   return exports;" + "\n" +
                                "});";

                            fs.write(fd, string, 0, 'utf8', function(e) {
                                if (e) throw e;
                                fs.closeSync(fd);
                            });
                        });
                    }
                });

            }
        });
    }
});


gulp.task('help', function() {
    console.log("gulp watchless  -> 监听less");
    console.log("gulp new --name projectName  -> 创建新的项目");
    console.log("gulp newp --name projectName:pageName:js  -> 创建新的页面，如果有参数js则自动添加js");
    console.log("gulp newc --name projectName:componentsName   -> 创建新的组件");
    console.log("gulp newjs --name projectName:jsName   -> 创建新的脚本");
});

function getModules(str) {
    var modules = [];
    str.replace(/<%\s*include{1}\s+\S*\/{1}(\S+)\.ejs{1}\s*\S*%>/ig, function($1, $2) {
        modules.push($2);
    });
    console.log(modules)
    return modules;
}

//检查数组是否重复

function hasProperty(arr, name) {
    var hasProperty = false;
    arr.forEach(function(o, index) {
        if (o.trim() === name) {
            hasProperty = true;
        }
    })
    return hasProperty;
}
