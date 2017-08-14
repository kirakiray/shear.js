(function($) {
    // 资源寄存对象
    var source = {};

    // lazyload 逻辑
    var ob;
    ob = window.IntersectionObserver && (new IntersectionObserver(
        function(changes) {
            changes.forEach(function(change) {
                var target = change.target;
                if (change.isIntersecting) {
                    $(target).trigger('loadimg');
                    ob.unobserve(target);
                }
            });
        }
    ));

    // 通过ajax获取图片的方法
    var getImg = function(url, callback) {
        var sdata = source[url];

        // 判断是否存在
        if (sdata) {
            callback(sdata);
            return;
        }

        sdata = source[url] = {
            state: 1,
            e: $({}),
            // url:""
        };

        callback(sdata);

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = "blob";

        //注册状态改变事件
        xhr.addEventListener('readystatechange', function(e) {
            var state = xhr.readyState;
            console.log("readystatechange=>", state);
        });
        xhr.addEventListener('load', function(e) {
            var state = xhr.readyState;

            var url = URL.createObjectURL(xhr.response);

            // 获取资源并触发事件
            sdata.url = url;
            sdata.state = 2;
            sdata.e.trigger('loaded');

            console.log("load=>", xhr.response);
        });
        xhr.addEventListener('error', function(e) {
            var state = xhr.readyState;
            console.log("error=>", state);
        });

        xhr.addEventListener('progress', function(e) {
            sdata.e.trigger('progress', e.loaded / e.total);
        });

        xhr.send();
    };

    shear.register({
        ele: '<div sv-register="lazyimg"><div class="lazyimg_main" sv-tar="main"></div><div class="lazyimg_progress"><div sv-tar="pEle" class="lazyimg_progress_in"></div></div><div sv-tar="inborder" class="lazyimg_inborder"></div></div>',
        attrs: ['src', 'width', 'height', 'inborder'],
        watch: {
            width: function(beforeVal, val) {
                if (String(val).search('%') == -1) {
                    val += "px";
                }
                this.css({
                    width: val
                });
                this.$main.css('background-size', val + "px " + this.height + "px");
            },
            height: function(beforeVal, val) {
                this.css({
                    height: val + "px"
                });
                this.$main.css('background-size', this.width + "px " + val + "px");
            },
            inborder: function(beforeVal, val) {
                this.$inborder.css('border', val);
            }
        },
        data: {
            width: 100
        },
        render: function($this) {
            var getImgCallback = function(sdata) {
                if (sdata.state == 1) {
                    // 进度监听
                    sdata.e.on('progress', function(e, data) {
                        // 设置进度
                        $this.$pEle.css('width', data * 100 + "%");
                    });

                    // 加载完成
                    sdata.e.one('loaded', function() {
                        $this.$main.css({
                            'background-image': 'url(' + sdata.url + ')',
                            'opacity': 1
                        });
                        $this.$pEle.css('opacity', 0);
                        sdata.e.off('progress');
                    });

                } else if (sdata.state == 2) {
                    $this.$main.css({
                        'background-image': 'url(' + sdata.url + ')',
                        'opacity': 1
                    });
                    $this.$pEle.css('opacity', 0);
                }
            };
            // 添加lazyload
            if (ob) {
                ob.observe($this[0]);

                // 添加加载图片事件
                $this.one('loadimg', function() {
                    getImg($this.src, getImgCallback);
                });
            } else {
                // 没有这个API就直接获取
                getImg($this.src, getImgCallback);
            }
        }
    });
})($);