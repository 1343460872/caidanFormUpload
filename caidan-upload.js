
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/************************************************************************
 * @Name caidan-upload
 * @Desc 文件上传 支持拖拽上传，上传文件夹，进度条
 * @Version v0.1
 * @Time 2018-8-18 17:42
 * @Author caidan
 * @Email 1343460872@qq.com
 * @other v0.2 更新计划
 *              - 断点续传
 *              - 请求地址传参
 *              - 脱离jquery
 *
 *
 * 参数说明
 * var option = {
 *      parentEle : '#uploadRequirement', // 目标元素 !!!
 *      fileEle : '#uploadFile', // 上传单个文件的元素
 *      directoryEle : '#uploadDirectory', // 上传文件夹的元素
 *      dragEle : '#upload-dragger', // 拖拽的元素
 *      showEle : '#requirementFileList', // 文件列表的目标元素
 *      fileListCountEle : '#fileListCount', // 已上传成功文件个数的元素
 *      fileListAddCountEle : '#fileListAddCount', // 已添加到上传列表的文件个数元素
 *      showTemplate: '{fileIndex} - {fileFormat} - {inputFileName} - {formatSizeInputFile}', // 显示的模板
 *      fileType : '*', // 允许上传类型 ["stl", "stp", "cdr", "jpg", "rar", "xlsx", "doc", "png", "xls", "zip", "docx"]
 *      viewFileType : ["jpg", "png", "gif"], // 能预览的格式 !!!增加stl格式 , "xlsx", "doc", "xls", "docx"
 *      publicFile : [], // 上传公有文件的格式  "jpg", "xlsx", "doc", "png", "xls", "docx"  | , "stl", "pdf"
 *      fileSize : 2 * 1024 * 1024, // 支持最大上传 2G: 2*1024*1024*1024
 *      fileCount : 20 // 支持最大上传文件个数
 *  }
 * var requirementUpload = new caidanUploadFile(option)
 *
 * 方法说明
 *      - set(itemList)
 *      - get()
 * var itemList = { // 接口返回
 *     "pageSize": 10,
 *     "pageNo": 1,
 *     "id": "447ba7e4-99e7-4c88-b66d-26fc132f49e4",
 *     "userRequirementId": "8550aaa8-8de7-49b0-8941-b19e6c115e81",
 *     "itemName": "drawing_enclosure",
 *     "itemValue": "image/user/6c397b5a-4ab9-4c0f-9743-8efccde874aa.png,image/user/05732027-d493-4183-bc10-8fa31f98650e.jpg,image/user/e392cf60-7e57-447e-bb28-6018b2d4a8d5.png,",
 *     "itemType": "input_file",
 *     "status": 0,
 *     "creator": "fad68200-4984-45f5-a404-1036155d1566",
 *     "createTime": 1534385077000,
 *     "lastUpdator": "fad68200-4984-45f5-a404-1036155d1566",
 *     "lastUpdateTime": 1534385077000
 * }
 * requirementUpload.set(itemList)
 * requirementUpload.get()
 * **********************************************************************/
var bucket = 'private-okodm';
var region = 'oss-cn-shenzhen';
var privateFileHost = 'http://' + bucket + '.' + region + '.aliyuncs.com/';

function caidanUploadFile(option) {
    var option = option || {};
    var that = this;

    this.parentEle = option.parentEle || '#uploadRequirement'; // 目标元素 !!!
    this.fileEle = option.fileEle || '#uploadFile'; // 上传单个文件的元素
    this.directoryEle = option.directoryEle || '#uploadDirectory'; // 上传文件夹的元素
    this.dragEle = option.dragEle || '#upload-dragger'; // 拖拽的元素
    this.showEle = option.showEle || '#requirementFileList'; // 文件列表的目标元素
    this.fileListCountEle = option.fileListCountEle || '#fileListCount'; // 已上传成功文件个数的元素
    this.fileListAddCountEle = option.fileListAddCountEle || '#fileListAddCount'; // 已添加到上传列表的文件个数元素
    this.showTemplate = option.showTemplate || '<li class="upload-files-item files-item" index="{fileIndex}">\n                                                    <span class="upload-files-icon icon-{fileFormat}"></span>\n                                                    <div class="upload-files-cont">\n                                                        <a href="javascript:;" class="upload-files-name" title="{inputFileName}{formatSizeInputFile}">{inputFileName}</a>\n                                                        <span class="upload-files-size hide">{formatSizeInputFile}</span>\n                                                        <span class="upload-files-process">\n                                                            <span class="upload-files-bar">\n                                                                <span style="width:0%;" class="files-bar"></span>\n                                                            </span>\n                                                            <span class="upload-files-percent files-percent">0%</span>\n                                                        </span>\n                                                    </div>\n                                                    <div class="upload-files-operate">\n                                                        <a href="" target="_blank" class="files-preview hide"><i class="iconfont icon-yanjing upload-files-preview" title="\u9884\u89C8"></i></a>\n                                                        <i class="iconfont icon-close-b upload-files-del files-del" title="\u5220\u9664"></i>\n                                                    </div>\n                                                </li>';
    this.fileType = option.fileType || '*'; // 允许上传类型 ["stl", "stp", "cdr", "jpg", "rar", "xlsx", "doc", "png", "xls", "zip", "docx"]
    this.viewFileType = option.viewFileType || ["jpg", "png", "gif"]; // 能预览的格式 !!!增加stl格式 , "xlsx", "doc", "xls", "docx"
    this.publicFile = option.publicFile || []; // 上传公有文件的格式  "jpg", "xlsx", "doc", "png", "xls", "docx"  | , "stl", "pdf"
    this.fileSize = option.fileSize || 2 * 1024 * 1024; // 图纸最大上传 2G: 2*1024*1024*1024
    this.fileCount = option.fileCount || 20;
    this.fileIndex = 0;
    this.files = {};
    this.filesLen = 0; // 上传成功的文件数据


    function init() {
        if (option.files.length !== 0) {//修改状态

        }
    }

    drag(this.dragEle, uploadRequirementFile);

    $('.uploadRequirementfile').on('change', function (e) {
        console.log('change', e.target.files.length);
        uploadRequirementFile(e.target.files, 'select');
        $('.uploadRequirementfile').val('')
    });

    function drag(ele, callback) {
        if (ele === undefined || $(ele).size() === 0 || typeof callback !== 'function') {
            console.log('拖拽传参 出错', ele, callback);
        }
        document.querySelector(that.dragEle).addEventListener('dragover', function (event) {
            event.stopPropagation();
            event.preventDefault();
            $(that.dragEle).addClass('upload-dragger-focus');
        }, false);
        document.querySelector(that.dragEle).addEventListener('dragleave', function (event) {
            $(that.dragEle).removeClass('upload-dragger-focus');
        }, false);
        document.querySelector(that.dragEle).addEventListener('drop', function (event) {
            event.stopPropagation();
            event.preventDefault();
            $(that.dragEle).removeClass('upload-dragger-focus');
            var dataTransfer = event.dataTransfer;
            callback(dataTransfer);
        }, false);
    }

    function uploadRequirementFile(dataTransfer, type) {
        if (type === 'select') {
            //选择文件/文件夹
            complete(dataTransfer);
        } else {
            //拖拽
            getFiles(dataTransfer, complete);
        }

        function complete(files) {
            console.log(files, 'complete 接收');
            if (verifyRequirementFile(files) === true && verifyRepeatFile(files) === false) {
                $('.upload-box').removeClass('hide');
                console.log('文件验证通过', JSON.stringify(files));

                [].slice.call(files).forEach(function (file, index) {

                    var fileFormat = file.name.replace(/.*\./g, '').toLowerCase();
                    var fileIndex = that.fileIndex;
                    addRequirementFileHtml(file);

                    console.log(fileIndex, '读取文件');
                    var $target = $('li[index=' + fileIndex + ']', that.showEle);
                    console.log($target, '$target');
                    if (that.publicFile.includes(fileFormat) === true) {
                        uploadPulicFile(file, readSuccess($target, fileIndex, fileFormat), uploading($target, fileFormat, fileIndex), uploadSuccess($target, fileIndex, fileFormat, pulicFileHost), function (ajax) {
                            // #del 两处有该段代码
                            $('.files-del', $target).click(function () {
                                delete that.files[fileIndex];
                                if (that.filesLen > 0) {
                                    that.filesLen -= 1;
                                }
                                $(that.fileListCountEle).text(that.filesLen); // 已上传
                                $(that.fileListAddCountEle).text(Object.keys(that.files).length); // 已添加
                                $(this).closest('.files-item').remove();
                                ajax.abort();
                            });
                        });
                    } else {
                        uploadPrivateFile(file, readSuccess($target, fileIndex, fileFormat), uploading($target, fileFormat, fileIndex), uploadSuccess($target, fileIndex, fileFormat), function ($ajax) {
                            //删除
                            $('.files-del', $target).click(function () {
                                console.log('.files-del click');
                                delete that.files[fileIndex];
                                if (that.filesLen > 0) {
                                    that.filesLen -= 1;
                                }
                                $(that.fileListCountEle).text(that.filesLen); // 已上传
                                $(that.fileListAddCountEle).text(Object.keys(that.files).length); // 已添加
                                $(this).closest('.files-item').remove();

                                console.log($ajax);
                                $ajax.abort();
                            });

                        }, fileIndex);
                    }
                });
            } else {
                console.log('验证上传文件失败', verifyRequirementFile(files), verifyRepeatFile(files) === false, JSON.stringify(files) !== '[]', JSON.stringify(files) !== '{}');
            }
        }
    }

    /*
    * file: input选中的文件 或 已上传的文件
    * type: fill 填数据
    * */
    function addRequirementFileHtml(file, type) {
        var fileIndex = that.fileIndex;
        var inputFile = {};

        console.log('that.files 添加文件', file);

        if (type === 'fill') {
            that.files[fileIndex] = {
                status: 'read',
                file: {},
                readFile: file
            };
            inputFile = { name: file.filename, size: file.filesize };
        } else {
            that.files[fileIndex] = {
                status: 'start',
                file: file,
                readFile: {}
            };
            inputFile = file;
        }

        var fileFormat = inputFile.name && inputFile.name.replace(/.*\./g, '').toLowerCase();

        var filesLen = Object.keys(that.files).length;

        $(that.fileListAddCountEle).text(filesLen);
        var fileSize;
        if (type === 'fill') {
            fileSize = formatSize(inputFile.size * 1024);
        } else {
            fileSize = formatSize(inputFile.size);
        }

        $(that.showEle).prepend(render(that.showTemplate, {
            fileIndex: that.fileIndex,
            fileFormat: fileFormat,
            inputFileName: inputFile.name,
            formatSizeInputFile: fileSize
        }));

        if (type === 'fill') {
            // 模拟上传完成动作
            var $target = $('li[index=' + fileIndex + ']', that.showEle);
            console.log($target, 'target 模拟上传动作');
            writeFile($target, fileFormat, fileIndex, file);
            // #del 两处有该段代码
            $('.files-del', $target).click(function () {
                delete that.files[fileIndex];
                if (that.filesLen > 0) {
                    that.filesLen -= 1;
                }
                $(that.fileListCountEle).text(that.filesLen); // 已上传
                $(that.fileListAddCountEle).text(Object.keys(that.files).length); // 已添加
                $(this).closest('.files-item').remove();
            });
        }
        that.fileIndex += 1;
    }

    //上传公有文件
    function uploadPulicFile(file, readSuccess, uploading, uploadSuccess, ajax) {
        var formData = new FormData();
        formData.append('limitSize', that.fileSize); // limitSize单位:kb
        formData.append('savePath', 'image/user');
        formData.append('file', file);

        var $ajax = postFileWithPortalHeaderToken(system_config.interface_file_host_url + '/uploadPublicFile.do', formData, function (jsonResult) {
            if (jsonResult.resultCode == 200) {
                var fetchFileUrlJson = { "url": pulicFileHost + jsonResult.url };
                console.log('上传公有文件成功', fetchFileUrlJson);
                uploadSuccess(jsonResult);
            } else {
                newPopupRel("OKODM提示", jsonResult.resultMessage || '上传失败', "notBtn");
            }
        }, null, function (file, evt) {
            uploading(file, evt);
        });
        ajax($ajax);
    }

    function uploadFile(fileIndex, filePath, file, fn) {
        var fn = {
            readSuccess: fn.readSuccess,
            uploading: fn.uploading,
            uploadSuccess: fn.uploadSuccess
        };
        var uploadFileClient = that.files[fileIndex].uploadFileClient;
        var checkAccessToken = store.get('checkAccessToken');
        var now = new Date();
        var fileFormat = file.name.replace(/.*\./g, '').toLowerCase();
        var $target = $(that.parentEle + ' li[index="' + fileIndex + '"]');
        var path = {
            activeProfile: checkAccessToken.activeProfile,
            account: checkAccessToken.account,
            year: now.getYear() + 1900,
            month: now.getMonth() + 1,
            fileFormat: fileFormat
        };

        var key = path.activeProfile + '/' + path.account + '/' + path.year + '/' + path.month + '/image/user/' + filePath + '.' + path.fileFormat; // 文件存放地址
        console.log(file.name + ' => ' + key);

        function progress(percent, checkpoint) {
            var percent = Math.floor(percent * 100) + '%';
            fn.uploading({ percent: percent });
            that.files[fileIndex].currentCheckpoint = checkpoint; //记录断点
            console.log(percent);
        };

        var options = {
            progress: progress,
            partSize: 2 * 1024 * 1024, //2M
            meta: {
                year: 2018,
                people: 'test'
            }
        };
        if (that.files[fileIndex].currentCheckpoint) {
            options.checkpoint = that.files[fileIndex].currentCheckpoint; //断点续传
        }
        return uploadFileClient.multipartUpload(key, file, options).then(function (res) {

            postJsonWithPortalHeaderToken(api_fil.save_file_upload_log, {
                "bucketType": 1, //0:public;1:private
                "filesize": file.size / 1024,
                "filename": file.name,
                "url": res.name
            }, function (jsonData) {
                console.log('保存文件信息', jsonData);
                readPrivateFile(jsonData.url, fn.readSuccess);
            });

            console.log('upload success: %j', res);
            var jsonData = {
                filename: file.name,
                filesize: file.size / 1024,
                uploadUrl: res.name,
                url: res.name
            };
            fn.uploadSuccess(jsonData);

            that.files[fileIndex].currentCheckpoint = null;
            uploadFileClient = null;
        }).catch(function (err) {
            if (uploadFileClient && uploadFileClient.isCancel()) {
                console.log('stop-upload!');
            } else {
                console.log('分片失败', err);
            }
        });
    };

    function applyTokenDo(func, refreshSts, file, fileIndex, fn, ajax) {

        var refresh = typeof refreshSts !== 'undefined' ? refreshSts : true;
        if (refresh) {
            var $ajax = $.ajax({
                url: api_fil.get_oss_sts_credentials,
                headers: {
                    "userToken": store.get('zjy_portal_access_token'),
                    "ostype": 1
                },
                success: function success(result) {
                    var creds = result;
                    console.info(creds);
                    that.files[fileIndex].uploadFileClient = new OSS({
                        region: region,
                        accessKeyId: creds.accessKeyId,
                        accessKeySecret: creds.accessKeySecret,
                        stsToken: creds.stsToken,
                        bucket: bucket
                    });

                    console.log(OSS.version);
                    console.log(that.files[fileIndex].uploadFileClient);
                    return func(fileIndex, result.fileName, file, fn);
                }
            });
            console.log($ajax);
            ajax($ajax);
            return $ajax;
        }
        return func();
    };

    //上传私有文件
    function uploadPrivateFile(file, readSuccess, uploading, uploadSuccess, ajax, fileIndex) {
        applyTokenDo(uploadFile, true, file, fileIndex, { readSuccess: readSuccess, uploading: uploading, uploadSuccess: uploadSuccess }, ajax);

        return;
        var formData = new FormData();
        formData.append('limitSize', that.fileSize); // limitSize单位:kb
        formData.append('savePath', 'image/user');
        formData.append('file', file);
        var $ajax = postFileWithPortalHeaderToken(system_config.interface_file_host_url + '/uploadPrivateFile.do', formData, function (jsonResult) {
            if (jsonResult.resultCode == 200) {
                uploadSuccess(jsonResult);
                var fetchFileUrlJson = { "url": jsonResult.url };
                console.log('上传成功', fetchFileUrlJson);
                readPrivateFile(jsonResult.url, readSuccess);
            } else {
                newPopupRel("OKODM提示", jsonResult.resultMessage || '上传失败', "notBtn");
            }
        }, null, function (file, evt) {
            uploading(file, evt);
        });
        ajax($ajax);
    }

    //读取私有文件
    function readPrivateFile(url, success) {
        var fetchFileUrlJson = { "url": url };
        postJsonWithPortalHeaderToken(system_config.interface_file_host_url + '/getPrivateFileUrl.do', fetchFileUrlJson, function (jsonData) {
            console.log('服务器文件地址', jsonData.url);
            success(jsonData);
            return;
        });
    }

    function getFiles(dataTransfer, complete) {
        console.log(dataTransfer, 'getFiles files');
        var items = dataTransfer.items;
        if (items === undefined) {
            console.log(dataTransfer, 'getFiles(dataTransfer)');
            complete(dataTransfer);
            return;
        } else {
            for (var i = 0; i < items.length; i++) {
                var entry = items[i].webkitGetAsEntry();
                if (!entry) {
                    continue;
                }
                if (entry.isFile) {
                    entry.file(function (file) {
                        returnFile(file);
                    });
                } else {
                    folderRead(entry);
                }
            }
            console.log(items.length, '文件夹数量');
        }

        function returnFile(file) {
            console.log(file, 'complete 发送');
            complete([file]);
        }

        function folderRead(entry) {
            entry.createReader().readEntries(function (entries) {
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    if (entry.isFile) {
                        entry.file(function (file) {
                            returnFile(file);
                        });
                    } else {
                        folderRead(entry);
                    }
                }
            });
        }
    }

    function readSuccess($target, fileIndex, fileFormat) {
        return function (jsonData) {
            writeFile($target, fileFormat, fileIndex, jsonData);
        };
    }

    function uploading($target, fileFormat, fileIndex) {
        return function (file) {
            if (that.files[fileIndex] === undefined) {
                console.log(that.files);
                return;
            } else {
                that.files[fileIndex]['status'] = 'ing';
            }

            var $percent = file.percent;

            if ($percent === '100%') {
                $percent = '99%';
            }

            $target.find('.files-bar').width($percent).end().find('.files-percent').text($percent);
            console.log(file);
        };
    }

    function uploadSuccess($target, fileIndex, fileFormat, prev) {
        return function (jsonResult) {
            console.log('uploadSuccess', jsonResult);
            setPreviewFileUrl($target, jsonResult.url, fileFormat, prev);
            console.log(that.files[fileIndex], '上传成功');
            that.files[fileIndex]['status'] = 'complete';

            function isUploadComplete(files) {
                var uploadCompleteFlag = true;
                for (var i in files) {
                    if (files[i].status === 'ing') {
                        uploadCompleteFlag = false;
                    }
                }
                return uploadCompleteFlag;
            }

            var uploadCompleteFlag = isUploadComplete(that.files);

            if (uploadCompleteFlag === true) {
                $('.verify-fail', that.parentEle).hide();
            }

            console.log(jsonResult);
            if (prev !== undefined) {
                // 公有文件， 不执行readSuccess
                writeFile($target, fileFormat, fileIndex, jsonResult);
            }
        };
    }

    function writeFile($target, fileFormat, fileIndex, jsonData) {
        that.filesLen += 1;

        console.log(that.files[fileIndex], fileIndex, $target.attr('index'), '读取文件成功');
        $(that.fileListCountEle).text(that.filesLen);
        that.files[fileIndex]['status'] = 'read';
        that.files[fileIndex]['readFile'] = jsonData;
        console.log('读取文件', jsonData, $target);
        setPreviewFileUrl($target, jsonData.url, fileFormat);
        console.log(jsonData);
        $target.find('.upload-files-process').remove();
        $target.find('.upload-files-size').removeClass('hide');
    }

    function setPreviewFileUrl($target, url, fileFormat, prev) {
        if (that.viewFileType.includes(fileFormat) === true) {
            if (viewFileFlag === true) {
                $target.find('.files-preview').attr('href', '/preview/#' + (prev || '') + url).removeClass('hide');
            }
        }
    }

    function verifyRepeatFile(files) {
        var flag = false;
        var thatFiles = that.files;
        var thatFilesBySize = {};
        var repeatFiles = [];
        if (JSON.stringify(thatFiles) === '{}') {
            return false;
        }
        console.log(thatFiles, 'thatFiles');
        for (var i in thatFiles) {
            var file = thatFiles[i].file;
            console.log(file, 'file');
            if (thatFilesBySize[file.size] === undefined) {
                thatFilesBySize[file.size] = [];
            }
            thatFilesBySize[file.size].push(file.name);
        }
        console.log(thatFilesBySize, '文件尺寸生成新json');

        // [].slice.call(files).forEach(function (val) {
        //     // ~~~考虑修改下的上传图片，阿里云会把文件大小取整，因此能上传重复文件
        //     if (thatFilesBySize[val.size] && thatFilesBySize[val.size].includes(val.name) === true) {
        //         repeatFiles.push({
        //             name: val.name,
        //             size: val.size
        //         });
        //         var repeatFilesHtml = '';
        //         repeatFiles.forEach(function (val) {
        //             repeatFilesHtml += '<br>' + val.name;
        //         });
        //         newPopupRel("OKODM提示", '以下文件已经上传' + repeatFilesHtml, "notBtn");
        //         flag = true;
        //     }
        // });
        console.log('重复文件', repeatFiles);
        return flag;
    }

    function renderCaidan(parent, subTemp, list) {
        if ($(parent).size() === 0 || typeof subTemp !== 'string') {
            console.warn('渲染失败', parent, subTemp, list);
            console.warn('渲染失败', $(parent).size(), typeof subTemp === 'undefined' ? 'undefined' : _typeof(subTemp), Array.isArray(list));
            return;
        }

        $(parent).empty();
        if (Array.isArray(list)) {
            var html = [];
            var i = list.length;
            while (i--) {
                html.unshift(render(subTemp, list[i]));
            }
            $(parent).html(html.join(''));
        } else {
            $(parent).html(render(subTemp, list));
        }
    }

    function render(tpl, data) {
        return tpl.replace(/{(\w+)}/g, function (find, some) {
            return data[some];
        });
    }

    // 验证文件是否符合要求
    function verifyRequirementFile(files) {
        var formatFlag = true;
        var sizeFlag = true;
        var nameFlag = true;
        var fileList = [].slice.call(files);
        var errFileFormat = [];
        var errFileSize = [];
        //console.log(Object.keys(that.files), 'Object.keys(that.files)');// slow
        if (fileList.length === 0) {
            //newPopupRel("OKODM提示", '未选择文件', "notBtn");
            return false;
        }
        console.log('已上传文件个数', fileList.length + Object.keys(that.files).length, that.fileCount);
        if (fileList.length + Object.keys(that.files).length > that.fileCount) {
            newPopupRel("OKODM提示", '上传文件超过限制(' + that.fileCount + '个),请将多个文件打包后重新上传!', "notBtn");
            return false;
        }
        fileList.forEach(function (val) {
            console.log(val, 'saf');
            var fileFormat = val.name.replace(/(.*\.)/, '').toLowerCase();
            if (val.type === '') {
                console.log('上传了一个文件夹');
                //return false;
            }
            // 文件类型
            if (that.fileType.includes(fileFormat) === true || that.fileType === '*') {} else {
                if (errFileFormat.includes(fileFormat) === false) {
                    errFileFormat.push(fileFormat);
                    formatFlag = false;
                }
            }
            // 文件大小
            if (val.size / 1024 > that.fileSize) {
                errFileSize.push({
                    name: val.name,
                    size: val.size
                });
                sizeFlag = false;
            }
            // 文件名称
            var fileReg = /[&,|\/<>!^%]+/;
            if (val.name.charAt(0) === '.' || fileReg.test(val.name) === true) {
                nameFlag = false;
            }
        });
        if (formatFlag === false) {
            newPopupRel("OKODM提示", '不支持' + errFileFormat.join(',') + '格式', "notBtn");
            return false;
        }
        if (sizeFlag === false) {
            console.log(errFileSize);
            var errFileSizeHtml = '';
            errFileSize.forEach(function (val) {
                errFileSizeHtml += '<br>' + val.name + '(' + formatSize(val.size) + ')';
            });
            newPopupRel("OKODM提示", '以下文件超出' + formatSize(that.fileSize * 1024) + '，请压缩或拆分文件后上传！' + errFileSizeHtml, "notBtn");
            return false;
        }
        if (nameFlag === false) {
            newPopupRel("OKODM提示", '上传失败,文件名中不能含有特殊符号&,|\/<>!^%', "notBtn");
            return false;
        }
        return true;
    }

    function getUrlList(itemList, type) {
        if (itemList.length === 0) {
            console.warn('图纸列表为空');
            return;
        }

        var urlJsonList = [];
        if (type === 'return') {
            // 上一步
            console.warn('返回上一步图纸列表', itemList);
            itemList.forEach(function (val) {
                urlJsonList.push({ url: val.uploadUrl });
            });
        } else {
            // 重新发布 修改
            itemList.forEach(function (val) {
                if (val.type === 'DEMANDFILE') {
                    val.path.split(',').forEach(function (val) {
                        urlJsonList.push({ url: val });
                    });
                }
            });
            console.warn('重新发布 修改图纸列表', itemList, urlJsonList);
        }

        return urlJsonList;
    }

    function readFileList(list, success) {
        if (list === undefined) {
            console.warn('调用文件列表详情 失败 list空');
            return;
        }
        console.log('调用文件列表详情 接口', list);
        var fetchFileUrlJson = list;
        postJsonWithPortalHeaderToken(api_fil.get_private_file_url_list, fetchFileUrlJson, function (jsonResult) {
            if (jsonResult.resultCode === '200') {
                success(jsonResult.list);
                console.log('读取文件列表详情', jsonResult.list);
            } else {
                console.warn('调用文件列表详情 失败', jsonResult);
                newPopupRel("OKODM提示", jsonResult.resultMessage || '上传失败', "notBtn");
            }
        });
    }

    // 填充图纸列表
    function fillFileList(itemList, type, successFn) {
        if (itemList.length === 0) {
            console.warn('图纸列表 空');
            return;
        }
        console.log('图纸列表', type, itemList);
        if (type === 'return') {
            var fileList = itemList;
            fileList.forEach(function (file, fileIndex) {
                addRequirementFileHtml(file, 'fill');
            });
            successFn(fileList);
        } else {
            readFileList(getUrlList(itemList, type), function (fileList) {
                fileList.forEach(function (file, fileIndex) {
                    addRequirementFileHtml(file, 'fill');
                });
                successFn(fileList);
                console.info(fileList, '成功获取文件列表详情');
            });
        }
    }

    this.set = function (itemList, type, successFn) {
        console.log(itemList, type);
        fillFileList(itemList, type, successFn);
    };
};

caidanUploadFile.prototype.get = function () {
    return this.files;
};