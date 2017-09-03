(function(glo) {
    //@base---start
    "use strict";
    //common
    var SMARTKEY = "_s_" + new Date().getTime();
    var SMARTEVENTKEY = SMARTKEY + "_e";
    var STR_function = "function";
    var STR_string = "string";
    var STR_object = "object";
    var STR_undefined = "undefined";
    var UNDEFINED = undefined;
    var DOCUMENT = document;

    //function
    var arrlyslice = Array.prototype.slice;
    var makeArray = function(arrobj) {
        return arrlyslice.call(arrobj);
    };

    //获取类型
    var getType = function(value) {
        return Object.prototype.toString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    };

    //合并对象
    var extend = function(def) {
        var args = makeArray(arguments).slice(1);
        arrayEach(args, function(opt) {
            for (var key in opt) {
                def[key] = opt[key];
            }
        });
        return def;
    };

    //arr类型的遍历
    var arrayEach = function(arr, func) {
        !(arr instanceof Array) && (arr = makeArray(arr));
        arr.some(function(e, i) {
            return func(e, i) === false;
        });
        return arr;
    };

    //obj类型的遍历
    var objEach = function(obj, func) {
        var i;
        for (i in obj) {
            if (func(i, obj[i]) === false) {
                break;
            };
        }
        return obj;
    }

    //合并数组
    var merge = function(arr1, arr2) {
        var fakeArr2 = makeArray(arr2);
        fakeArr2.unshift(arr1.length, 0);
        arr1.splice.apply(arr1, fakeArr2);
        return arr1;
    };

    //SmartFinder---------start
    //匹配数组中的专用元素并返回
    var fliterDedicatedEles = function(beforeData, selecter) {
        var redata = [];
        switch (selecter) {
            case ":odd":
                redata = beforeData.filter(function(e, i) {
                    return !((i + 1) % 2);
                });
                break;
            case ":even":
                redata = beforeData.filter(function(e, i) {
                    return (i + 1) % 2;
                });
                break;
            case ":parent":
                redata = beforeData.filter(function(e) {
                    return !!e.innerHTML;
                });
                break;
            case ":first":
                redata = [beforeData[0]];
                break;
            case ":last":
                redata = beforeData.slice(-1);
                break;
            case ":header":
                redata = findEles(beforeData, "h1,h2,h3,h4,h5");
                break;
            case ":hidden":
                beforeData.forEach(function(e) {
                    if (getComputedStyle(e).display === "none" || e.type === "hidden") {
                        redata.push(e);
                    }
                });
                break;
            case ":visible":
                beforeData.forEach(function(e) {
                    if (getComputedStyle(e).display != "none" && e.type != "hidden") {
                        redata.push(e);
                    }
                });
                break;
            default:
                var expr_five;
                if (expr_five = selecter.match(/:eq\((.+?)\)/)) {
                    var e1 = parseInt(expr_five[1]);
                    redata = beforeData.slice(e1, e1 > 0 ? e1 + 1 : UNDEFINED);
                    break;
                }
                if (expr_five = selecter.match(/:lt\((.+?)\)/)) {
                    redata = beforeData.slice(0, expr_five[1]);
                    break;
                }
                if (expr_five = selecter.match(/:gt\((.+?)\)/)) {
                    redata = beforeData.slice(parseInt(expr_five[1]) + 1);
                    break;
                }
                if (expr_five = selecter.match(/:has\((.+?)\)/)) {
                    beforeData.forEach(function(e) {
                        var findele = findEles(e, expr_five[1]);
                        if (0 in findele) {
                            redata.push(e);
                        }
                    });
                    break;
                }
                if (expr_five = selecter.match(/:contains\((.+?)\)/)) {
                    beforeData.forEach(function(e) {
                        if (e.innerHTML.search(expr_five[1]) > -1) {
                            redata.push(e);
                        }
                    });
                    break;
                }
        }

        return redata;
    };

    var spe_expr = /(.*)(:even|:odd|:header|:parent|:hidden|:eq\(.+?\)|:gt\(.+?\)|:lt\(.+?\)|:has\(.+?\)|:contains\(.+?\)|:first(?!-)|:last(?!-))(.*)/;
    //查找元素的方法
    var findEles = function(owner, expr) {
        var redata = [];

        expr = expr.trim();

        //判断表达式是否空
        if (!expr) {
            return owner.length ? owner : [owner];
        }

        //判断是否有专属选择器
        var speMatch = expr.match(spe_expr);

        //存在专属字符进入专属字符通道
        if (speMatch) {
            if (/,/.test(expr)) {
                //带有分组信息需要分开处理
                expr.split(',').forEach(function(e) {
                    merge(redata, findEles(owner, e));
                });
            } else if (expr.match(/(.+?):not\((.+?)\)/)) {
                //not有对专用字符有特殊的处理渠道
                //筛选not关键信息
                //拆分括号
                var notStrArr = expr.replace(/([\(\)])/g, "$1&").split('&');

                //搜索到第一个not后开始计数
                var nCount = 0;
                var nAction = 0;
                var beforestr = "";
                var targetStr = "";
                var afterStr = "";
                notStrArr.forEach(function(e) {
                    if (!nAction) {
                        if (e.search(/:not\(/) > -1) {
                            nAction = 1;
                            nCount++;
                            //加上非not字符串
                            beforestr += e.replace(/:not\(/, "");
                        } else {
                            beforestr += e;
                        }
                    } else {
                        if (e.search(/\(/) > -1) {
                            nCount++;
                        } else if (e.search(/\)/) > -1) {
                            nCount--;
                        }
                        if (nAction === 1 && !nCount) {
                            nAction = 2;
                        } else if (nAction === 2) {
                            afterStr += e;
                        } else {
                            targetStr += e;
                        }
                    }
                });

                //获取相应关键元素
                var ruleInEle = findEles(owner, beforestr);
                var ruleOutEle = findEles(owner, beforestr + targetStr);
                ruleInEle.forEach(function(e) {
                    ruleOutEle.indexOf(e) === -1 && redata.push(e);
                }, this);

                //查找后续元素
                if (afterStr) {
                    redata = findEles(redata, afterStr);
                }
            } else {
                //没有not就好说
                //查找元素后，匹配特有字符
                redata = findEles(owner, speMatch[1]);
                redata = fliterDedicatedEles(redata, speMatch[2]);

                //查找后续元素
                if (speMatch[3]) {
                    redata = findEles(redata, speMatch[3]);
                }
            }
        } else {
            //是否是Text节点
            if (owner instanceof Text) {
                redata = [owner];
            } else if (owner.length && owner instanceof Element) {
                //没有的话直接查找元素
                owner.forEach(function(e) {
                    merge(redata, findEles(e, expr));
                });
            } else {
                //查看看是否有原生querySelectorAll支持但是有缺陷的表达方式
                var matchData;
                if (matchData = expr.match(/^>(\S*) *(.*)/)) {
                    if (1 in matchData) {
                        var expr2 = matchData[1];
                        makeArray(owner.children).forEach(function(e) {
                            judgeEle(e, expr2) && redata.push(e);
                        });
                    }
                } else {
                    redata = owner.querySelectorAll(expr);
                }
            }
        }

        return makeArray(redata);
    };
    //SmartFinder---------end

    //判断元素是否符合条件
    var judgeEle = function(ele, expr) {
        var fadeParent = DOCUMENT.createElement('div');
        if (ele === DOCUMENT) {
            return false;
        }
        fadeParent.appendChild(ele.cloneNode(false));
        return 0 in findEles(fadeParent, expr) ? true : false;
    };

    //转换字符串到html对象
    var transToEles = function(str) {
        var par = DOCUMENT.createElement('div');
        par.innerHTML = str;
        var ch = makeArray(par.childNodes);
        par.innerHTML = "";
        return ch.filter(function(e) {
            var isInText = e instanceof Text;
            if ((isInText && e.textContent.trim()) || !isInText) {
                return e;
            }
        });
    };

    //main
    function smartJQ(selector, context) {
        return this.init(selector, context);
    };

    var prototypeObj = Object.create(Array.prototype);

    //初始化函数
    prototypeObj.init = function(arg1, arg2) {
        //只有一个参数的情况
        var a1type = getType(arg1);
        switch (a1type) {
            case STR_string:
                if (/</.test(arg1)) {
                    //带有生成对象的类型
                    merge(this, transToEles(arg1));
                } else {
                    //查找元素
                    var eles = [];
                    var arg2type = getType(arg2);
                    if (arg2type === STR_string) {
                        //参数2有的情况下
                        var parnodes = findEles(DOCUMENT, arg2);
                        arrayEach(parnodes, function(e) {
                            var tareles = findEles(e, arg1);
                            arrayEach(tareles, function(e) {
                                if (eles.indexOf(e) === -1) {
                                    eles.push(e);
                                }
                            });
                        });
                    } else if (arg2 instanceof Element) {
                        eles = findEles(arg2, arg1);
                    } else if (!arg2) {
                        eles = findEles(DOCUMENT, arg1);
                    }
                    merge(this, eles);
                }
                break;
            case STR_function:
                if (DOCUMENT.readyState === "complete") {
                    arg1($)
                } else {
                    DOCUMENT.addEventListener('DOMContentLoaded', function() {
                        arg1($)
                    }, false);
                }
                break;
            default:
                if (arg1 instanceof smartJQ) {
                    return arg1;
                } else if (arg1 instanceof Array) {
                    merge(this, arg1);
                } else if (!arg1) {
                    return $([]);
                } else if (!arg2) {
                    this.push(arg1);
                } else if (arg2) {
                    eles = findEles(arg1, arg2);
                    merge(this, eles);
                }
        }
        return this;
    }

    //init
    var $ = function(selector, context) {
        // if (!selector) {
        //     return $([]);
        // }
        return new smartJQ(selector, context);
    };
    $.fn = $.prototype = smartJQ.fn = smartJQ.prototype = prototypeObj;

    glo.$ = $;
    // glo.smartJQ = smartJQ;

    //在$上的方法
    //随框架附赠的方法
    //@must---$.extend
    //@must---$.makearray
    //@must---$.merge
    //@must---$.type
    extend($, {
        expando: SMARTKEY,
        extend: extend,
        makearray: makeArray,
        merge: merge,
        type: getType
    });
    //@base---end


    extend(prototypeObj, {
        //设置样式
        css: function(name, value) {
            //第一个是对象类型
            if (getType(name) === STR_object) {
                arrayEach(this, function(e) {
                    objEach(name, function(n, v) {
                        // 判断单位是否px
                        var orival = String(getComputedStyle(e)[n]);
                        if (orival.search('px') > -1) {
                            if (String(v).search('px') == -1) {
                                orival += "px";
                            }
                        }
                        e.style[n] = v;
                    });
                });
            } else if (getType(name) === STR_string && value != UNDEFINED) {
                arrayEach(this, function(e) {
                    e.style[name] = value;
                });
            } else if (getType(name) === STR_string && !value) {
                return getComputedStyle(this[0])[name];
            }
            return this;
        },
        offset: function() {
            // if (!options) {
            var tar = this[0];
            var boundingClientRect = tar.getBoundingClientRect();

            return {
                top: boundingClientRect.top + window.pageYOffset,
                left: boundingClientRect.left + window.pageXOffset
            };
            // }
        },
        position: function() {
            //@use---$.fn.css
            //@use---$.fn.offset
            //获取父元素
            var offsetParent = $(this[0].offsetParent);
            // var parentOffset = offsetParent.offset();
            var tarOffset = this.offset();

            var martop = parseFloat(this.css('marginTop'));
            var marleft = parseFloat(this.css('marginLeft'));

            var parentBordertop = parseFloat(offsetParent.css('borderTopWidth'));
            var parentBorderleft = parseFloat(offsetParent.css('borderLeftWidth'));

            return {
                // top: tarOffset.top - parentOffset.top - martop - parentBordertop,
                // left: tarOffset.left - parentOffset.left - marleft - parentBorderleft,
                top: tarOffset.top - martop - parentBordertop,
                left: tarOffset.left - marleft - parentBorderleft
            };
        },
        _sc: function(key, val) {
            return val === UNDEFINED ? this[0][key] : arrayEach(this, function(tar) {
                tar[key] = val;
            });
        },
        scrollTop: function(val) {
            //@use---$.fn._sc
            return this._sc('scrollTop', val);
        },
        scrollLeft: function(val) {
            //@use---$.fn._sc
            return this._sc('scrollLeft', val);
        },
        _wh: function(key, val) {
            //@use---$.fn.css
            switch (getType(val)) {
                case STR_function:
                    return arrayEach(this, function(tar, i) {
                        var $tar = $(tar);
                        var reval = val.call(tar, i, parseFloat($tar.css(key)));
                        reval && $tar[key](reval);
                    });
                case STR_undefined:
                    return parseFloat(this.css(key));
                case "number":
                    val += "px";
                case STR_string:
                    return arrayEach(this, function(tar) {
                        $(tar).css(key, val);
                    });
            }
        },
        height: function(val) {
            //@use---$.fn._wh
            return this._wh("height", val);
        },
        width: function(val) {
            //@use---$.fn._wh
            return this._wh("width", val);
        },
        innerHeight: function() {
            return this[0].clientHeight;
        },
        innerWidth: function() {
            return this[0].clientWidth;
        },
        outerHeight: function() {
            return this[0].offsetHeight;
        },
        outerWidth: function() {
            return this[0].offsetWidth;
        },
        attr: function(name, value) {
            var _this = this;
            switch (getType(name)) {
                case STR_string:
                    if (value === UNDEFINED) {
                        var tar = _this[0];
                        return tar.getAttribute && tar.getAttribute(name);
                    } else {
                        arrayEach(_this, function(tar) {
                            tar.setAttribute && tar.setAttribute(name, value);
                        });
                    }
                    break;
                case STR_object:
                    objEach(name, function(k, v) {
                        arrayEach(_this, function(tar) {
                            tar.setAttribute && tar.setAttribute(k, v);
                        });
                    });
                    break
            }
            return _this;
        },
        removeAttr: function(name) {
            return arrayEach(this, function(tar) {
                tar.removeAttribute(name);
            });
        },
        prop: function(name, value) {
            switch (getType(name)) {
                case STR_string:
                    if (value === UNDEFINED) {
                        var tar = this[0];
                        if (!tar) {
                            return UNDEFINED;
                        }
                        return tar[name];
                    } else if (getType(value) === STR_function) {
                        arrayEach(this, function(e, i) {
                            var revalue = value.call(e, i, e[name]);
                            (revalue != UNDEFINED) && (e[name] = revalue);
                        });
                    } else {
                        arrayEach(this, function(e) {
                            e[name] = value;
                        });
                    }
                    break;
                case STR_object:
                    arrayEach(this, function(e) {
                        objEach(name, function(k, v) {
                            e[k] = v;
                        });
                    });
            }
            return this;
        },
        removeProp: function(name) {
            return arrayEach(this, function(e) {
                // if (e instanceof EventTarget && name in e.cloneNode()) {
                if (e.nodeType && name in e.cloneNode()) {
                    e[name] = "";
                } else {
                    delete e[name];
                }
            });
        },
        html: function(val) {
            //@use---$.fn.prop
            if (val instanceof smartJQ) {
                //市面上有好多插件使用不规范写法，下面针对不规范写法做兼容，有需要以后会去除掉
                arrayEach(this, function(e) {
                    e.innerHTML = "";
                    e.appendChild(val[0]);
                });
            } else {
                return this.prop('innerHTML', val);
            }
        },
        text: function(val) {
            //@use---$.fn.prop
            return this.prop('innerText', val);
        },
        val: function(vals) {
            //@use---$.fn.prop
            switch (getType(vals)) {
                case STR_string:
                    vals = [vals];
                case "array":
                    var mapvals = function(option) {
                        arrayEach(vals, function(val) {
                            var bool = false;
                            if (option.value === val) {
                                bool = true;
                            }
                            if ("selected" in option) {
                                option.selected = bool;
                            } else if ("checked" in option && (option.type === "checkbox" || option.type === "radio")) {
                                option.checked = bool;
                            } else {
                                option.value = val;
                            }
                            if (bool) {
                                return false;
                            }
                        });
                    };
                    arrayEach(this, function(ele, i) {
                        if (0 in ele) {
                            arrayEach(ele, function(option, i) {
                                mapvals(option);
                            });
                        } else {
                            mapvals(ele);
                        }
                    });
                    mapvals = null;
                    return this;
                case STR_undefined:
                    var tar = this[0];
                    if (!tar) {
                        return;
                    }
                    if (tar.multiple) {
                        var rearr = [];
                        arrayEach(tar, function(e) {
                            (e.selected || e.checked) && rearr.push(e.value);
                        });
                        return rearr;
                    }
                default:
                    return this.prop('value', vals);

            }
        },
        addClass: function(name) {
            return arrayEach(this, function(e) {
                e.classList.add(name);
            });
        },
        removeClass: function(name) {
            return arrayEach(this, function(e) {
                e.classList.remove(name);
            });
        },
        toggleClass: function(name) {
            return arrayEach(this, function(e) {
                e.classList.toggle(name);
            });
        },
        hasClass: function(name) {
            var tar = this[0];
            return tar ? makeArray(tar.classList).indexOf(name) > -1 : false;
        },
        //添加元素公用的方法
        _ec: function(ele, targets, func) {
            // targets = $(targets);
            var ele_type = getType(ele);
            if (ele_type === "string") {
                ele = transToEles(ele);
            } else if (ele instanceof Element) {
                ele = [ele];
            } else if (ele_type === STR_function) {
                arrayEach(targets, function(tar, i) {
                    var reobj = ele.call(tar, i, tar.innerHTML);
                    if (getType(reobj) === STR_string) {
                        reobj = transToEles(reobj);
                        arrayEach(reobj, function(e) {
                            func(e, tar);
                        });
                    };
                });
                return;
            }

            //最后的id
            var lastid = targets.length - 1;

            arrayEach(targets, function(tar, i) {
                arrayEach(ele, function(e) {
                    if (i === lastid) {
                        func(e, tar);
                    } else {
                        func(e.cloneNode(true), tar);
                    }
                });
            });
        },
        //元素操作
        append: function(ele) {
            //@use---$.fn._ec
            //判断类型
            prototypeObj._ec(ele, this, function(e, tar) {
                tar.appendChild(e);
            });
            return this;
        },
        appendTo: function(tars) {
            //@use---$.fn.append
            this.append.call($(tars), this);
            return this;
        },
        prepend: function(ele) {
            //@use---$.fn._ec
            prototypeObj._ec(ele, this, function(e, tar) {
                tar.insertBefore(e, tar.firstChild);
            });
            return this;
        },
        prependTo: function(tars) {
            //@use---$.fn.prepend
            this.prepend.call($(tars), this);
            return this;
        },
        after: function(ele) {
            //@use---$.fn._ec
            prototypeObj._ec(ele, this, function(e, tar) {
                var parnode = tar.parentNode;
                if (parnode.lastChild === tar) {
                    parnode.appendChild(e);
                } else {
                    parnode.insertBefore(e, tar.nextSibling);
                }
            });
            return this;
        },
        insertAfter: function(tars) {
            //@use---$.fn.after
            this.after.call($(tars), this);
            return this;
        },
        before: function(ele) {
            //@use---$.fn._ec
            prototypeObj._ec(ele, this, function(e, tar) {
                tar.parentNode.insertBefore(e, tar);
            });
            return this;
        },
        insertBefore: function(tars) {
            //@use---$.fn.before
            this.before.call($(tars), this);
            return this;
        },
        replaceWith: function(newContent) {
            //@use---$.fn.before
            return this.before(newContent).remove();
        },
        replaceAll: function(tar) {
            //@use---$.fn.replaceWith
            tar = $(tar);
            tar.replaceWith(this);
            return this;
        },
        wrap: function(val) {
            //@use---$.fn._ec
            prototypeObj._ec(val, this, function(e, tar) {
                tar.parentNode.insertBefore(e, tar);
                e.appendChild(tar);
            });
            return this;
        },
        unwrap: function() {
            //@use---$.fn.parent
            //@use---$.fn.after
            //@use---$.fn.remove
            var arr = [];
            arrayEach(this, function(e) {
                var par = $(e).parent();
                par.after(e);
                if (arr.indexOf(par[0]) === -1) {
                    arr.push(par[0]);
                }
            });
            $(arr).remove();
            return this;
        },
        wrapAll: function(val) {
            //@use---$.fn.before
            //@use---$.fn.append
            //在第一个前面添加该元素
            if (this[0]) {
                $(this[0]).before(val = $(val));
                arrayEach(this, function(e) {
                    val.append(e);
                });
            }
            return this;
        },
        wrapInner: function(val) {
            //@use---$.fn._ec
            prototypeObj._ec(val, this, function(e, tar) {
                arrayEach(tar.childNodes, function(e2) {
                    e.appendChild(e2);
                });
                tar.appendChild(e);
            });
        },
        empty: function() {
            return arrayEach(this, function(e) {
                e.innerHTML = "";
            });
        },
        remove: function(expr) {
            arrayEach(this, function(e) {
                if (expr) {
                    if (!judgeEle(e, expr)) return;
                }
                e.parentNode.removeChild(e);
            });
        },
        offsetParent: function() {
            var arr = [];
            arrayEach(this, function(e) {
                arr.push(e.offsetParent || DOCUMENT.body);
            });
            return $(arr);
        },
        children: function(expr) {
            var eles = [];
            arrayEach(this, function(e) {
                e.nodeType && arrayEach(e.children, function(e) {
                    if (expr) {
                        judgeEle(e, expr) && eles.push(e);
                    } else {
                        eles.push(e);
                    }
                });
            });
            return $(eles);
        },
        get: function(index) {
            return this[index] || makeArray(this);
        },
        map: function(callback) {
            var arr = [];
            arrayEach(this, function(e, i) {
                var resulte = callback.call(e, i, e);
                (resulte != UNDEFINED) && arr.push(resulte);
            });
            return $(arr);
        },
        slice: function(start, end) {
            return $([].slice.call(this, start, end));
        },
        eq: function(i) {
            //@use---$.fn.slice
            return this.slice(i, i + 1 || UNDEFINED);
        },
        first: function() {
            //@use---$.fn.eq
            return this.eq(0);
        },
        last: function() {
            //@use---$.fn.eq
            return this.eq(-1);
        },
        filter: function(expr) {
            var arr = [];
            switch (getType(expr)) {
                case STR_string:
                    arrayEach(this, function(e) {
                        if (judgeEle(e, expr)) {
                            arr.push(e);
                        }
                    });
                    break;
                case STR_function:
                    arrayEach(this, function(e, i) {
                        var result = expr.call(e, i, e);
                        if (result) {
                            arr.push(e);
                        }
                    });
                    break;
                default:
                    if (expr instanceof smartJQ) {
                        arrayEach(this, function(e) {
                            arrayEach(expr, function(tar) {
                                (e === tar) && arr.push(e);
                            });
                        });
                    } else if (expr.nodeType) {
                        arrayEach(this, function(e) {
                            (e === expr) && arr.push(e);
                        });
                    }
            }
            return $(arr);
        },
        not: function(expr) {
            //@use---$.fn.filter
            return this.filter(function(i, e) {
                return !judgeEle(e, expr);
            });
        },
        is: function(expr) {
            //@use---$.fn.filter
            var tars = this.filter(expr);
            return !!tars.length;
        },
        _np: function(expr, key) {
            var arr = [];
            arrayEach(this, function(tar) {
                tar = tar[key];
                if (!tar || arr.indexOf(tar) != -1 || (expr && !judgeEle(tar, expr))) {
                    return;
                }
                arr.push(tar);
            });
            return $(arr);
        },
        next: function(expr) {
            //@use---$.fn._np
            return this._np(expr, "nextElementSibling");
        },
        prev: function(expr) {
            //@use---$.fn._np
            return this._np(expr, "previousElementSibling");
        },
        parent: function(expr) {
            //@use---$.fn._np
            return this._np(expr, "parentNode");
        },
        _nu: function(key, filter, lastExpr) {
            var arr = [];
            var getEle = function(tar) {
                var nextEle = tar[key];
                if (nextEle) {
                    if (lastExpr) {
                        if ((getType(lastExpr) === STR_string && judgeEle(nextEle, lastExpr)) || lastExpr === nextEle || (lastExpr instanceof Array && lastExpr.indexOf(nextEle) > -1)) {
                            return;
                        }
                    }
                    if ((!filter || judgeEle(nextEle, filter)) && arr.indexOf(nextEle) === -1) {
                        arr.push(nextEle);
                    }
                    getEle(nextEle);
                }
            };
            arrayEach(this, function(tar) {
                getEle(tar);
            });
            getEle = null;
            return $(arr);
        },
        nextUntil: function(lastExpr, filter) {
            //@use---$.fn._nu
            return this._nu('nextElementSibling', filter, lastExpr);
        },
        prevUntil: function(lastExpr, filter) {
            //@use---$.fn._nu
            return this._nu('previousElementSibling', filter, lastExpr);
        },
        parentsUntil: function(lastExpr, filter) {
            //@use---$.fn._nu
            return this._nu('parentNode', filter, lastExpr);
        },
        nextAll: function(filter) {
            //@use---$.fn._nu
            return this._nu('nextElementSibling', filter);
        },
        prevAll: function(filter) {
            //@use---$.fn._nu
            return this._nu('previousElementSibling', filter);
        },
        parents: function(filter) {
            //@use---$.fn._nu
            return this._nu('parentNode', filter, DOCUMENT);
        },
        closest: function(selector, context) {
            //@use---$.fn.parentsUntil
            //@use---$.fn.parent
            var parentEles = $(selector).parent();
            context && parentEles.push(context);
            return this.parentsUntil(parentEles, selector);
        },
        siblings: function(expr) {
            //@use---$.fn.parent
            //@use---$.fn.children
            //@use---$.fn.map
            var _this = this;
            return this.parent().children(expr).map(function() {
                if (_this.indexOf(this) === -1) return this
            });
        },
        find: function(arg) {
            //@use---$.fn.parentsUntil
            var eles = [];
            if (getType(arg) === STR_string) {
                arrayEach(this, function(e) {
                    var arr = findEles(e, arg);
                    arrayEach(arr, function(e) {
                        if (eles.indexOf(e) === -1) {
                            eles.push(e);
                        }
                    });
                });
            } else if (arg instanceof smartJQ || arg.nodeType) {
                arg.nodeType && (arg = [arg]);
                var $this = this;
                arrayEach(arg, function(tar) {
                    var lastele = [].pop.call($(tar).parentsUntil($this));
                    if (lastele != DOCUMENT) {
                        eles.push(lastele);
                    }
                });
            }
            return $(eles);
        },
        has: function(expr) {
            //@use---$.fn.find
            var arr = [];
            arrayEach(this, function(tar) {
                if (0 in $(tar).find(expr)) {
                    arr.push(tar);
                }
            });
            return $(arr);
        },
        each: function(func) {
            return arrayEach(this, function(e, i) {
                func.call(e, i, e);
            });
        },
        index: function(ele) {
            var owner, tar;
            if (!ele) {
                tar = this[0];
                owner = makeArray(tar.parentNode.children);
            } else if (ele.nodeType) {
                tar = ele;
                owner = this;
            } else if (ele instanceof smartJQ) {
                tar = ele[0];
                owner = this;
            } else if (getType(ele) === STR_string) {
                tar = this[0];
                owner = $(ele);
            }
            return owner.indexOf(tar);
        },
        hide: function() {
            return arrayEach(this, function(e) {
                e.style['display'] = "none";
            });
            // return this;
        },
        show: function() {
            return arrayEach(this, function(e) {
                e.style['display'] = "";
            });
            // return this;
        },
        //获取制定对象数据的方法
        _ge: function(obj, keyname) {
            obj[keyname] || Object.defineProperty(obj, keyname, {
                configurable: true,
                writable: true,
                value: {}
            });
            return obj[keyname];
        },
        data: function(name, value) {
            //@use---$.fn._ge
            var smartData;
            switch (getType(name)) {
                case STR_string:
                    if (value === UNDEFINED) {
                        var tar = this[0];
                        if (!tar) {
                            return;
                        }
                        smartData = prototypeObj._ge(tar, SMARTKEY);

                        return smartData[name] || (tar.dataset && tar.dataset[name]) || tar.getAttribute('data-' + name);
                    } else {
                        arrayEach(this, function(tar) {
                            smartData = prototypeObj._ge(tar, SMARTKEY);
                            smartData[name] = value;
                        });
                    }
                    break;
                case STR_object:
                    arrayEach(this, function(tar) {
                        smartData = prototypeObj._ge(tar, SMARTKEY);
                        objEach(name, function(name, value) {
                            smartData[name] = value;
                        });
                    });
                    break;
                case STR_undefined:
                    var tar = this[0];
                    smartData = tar[SMARTKEY] || {};
                    return extend({}, tar.dataset, smartData);
            }
            return this;
        },
        removeData: function(name) {
            return arrayEach(this, function(tar) {
                var smartData = prototypeObj._ge(tar, SMARTKEY);
                delete smartData[name];
            });
        },
        //smartEvent事件触发器
        _tr: function(ele, eventName, newEventObject, triggerData) {
            //@use---$.fn.parents
            var smartEventData = ele[SMARTEVENTKEY];
            if (!smartEventData) return

            var smartEventObjs = smartEventData[eventName];

            var newArr = [];
            smartEventObjs && arrayEach(smartEventObjs, function(handleObj, i) {
                //设置事件对象
                var currentTarget = newEventObject.delegateTarget = ele;

                //是否可以call
                var cancall = 1;

                var delegateFilter = handleObj.s;
                if (delegateFilter) {
                    var targetEle = newEventObject.target,
                        tarparent = $(targetEle).parents(delegateFilter);

                    if (0 in tarparent) {
                        currentTarget = tarparent[0];
                    } else if (judgeEle(targetEle, delegateFilter)) {
                        currentTarget = targetEle;
                    } else {
                        cancall = 0;
                    }
                }

                if (cancall) {
                    //设置事件名
                    newEventObject.type = eventName;

                    //设置数据
                    newEventObject.data = handleObj.d;
                    newEventObject.currentTarget = currentTarget;
                    newEventObject.target || (newEventObject.target = ele);

                    //运行事件函数
                    var f = handleObj.f.bind(currentTarget);
                    triggerData ? f(newEventObject, triggerData) : f(newEventObject);

                    //判断是否阻止事件继续运行下去
                    if (newEventObject._ips) {
                        return false;
                    }
                }

                if (!handleObj.o) {
                    newArr.push(handleObj);
                }
            });
            if (!(0 in newArr)) {
                delete smartEventData[eventName];
            } else {
                smartEventData[eventName] = newArr;
            }
            smartEventObjs = null;
        },
        //注册事件
        on: function(arg1, arg2, arg3, arg4, isOne) {
            //@use---$.fn._tr
            //@use---$.fn._ge
            //@use---$.Event
            var selectors, data, _this = this;

            if (getType(arg1) === STR_object) {
                if (getType(arg2) === STR_string) {
                    selectors = arg2;
                    data = arg3;
                } else {
                    data = arg2;
                }
                objEach(arg1, function(eventName, callback) {
                    _this.on(eventName, selectors, data, callback);
                });
                return;
            }

            var callback, eventArr = arg1.split(" ");

            //判断第二个参数是否字符串，是的话就是目标
            switch (getType(arg2)) {
                case STR_function:
                    callback = arg2;
                    break;
                case STR_string:
                    selectors = arg2;
                    if (getType(arg3) === STR_function) {
                        callback = arg3;
                    } else {
                        data = arg3;
                        callback = arg4;
                    }
                    break;
                default:
                    data = arg2;
                    callback = arg3;
                    break;
            }

            arrayEach(eventArr, function(eventName) {
                //判断空
                if (!eventName) return;

                arrayEach(_this, function(tar) {
                    //事件寄宿对象
                    var smartEventData = prototypeObj._ge(tar, SMARTEVENTKEY);
                    var smartEventObj = smartEventData[eventName];

                    if (!smartEventObj) {
                        //设定事件对象
                        smartEventObj = (smartEventData[eventName] = []);

                        //属于事件元素的，则绑定事件
                        // if (tar instanceof EventTarget) {
                        if (tar.nodeType) {
                            tar.addEventListener(eventName, function(oriEvent) {
                                prototypeObj._tr(tar, eventName, $.Event(oriEvent));
                            });
                        }
                    }

                    //添加callback
                    smartEventObj.push({
                        //主体funciton
                        f: callback,
                        //数据data
                        d: data,
                        // 是否执行一次
                        o: isOne,
                        // 选择目标
                        s: selectors
                    });
                });
            });
            return this;
        },
        one: function(event, selector, data, callback) {
            //@use---$.fn.on
            return this.on(event, selector, data, callback, 1);
        },
        //触发事件
        trigger: function(eventName, data) {
            //@use---$.fn._tr
            //@use---$.Event
            return arrayEach(this, function(tar) {
                var event = $.Event(eventName);
                //拥有EventTarget的就触发
                // if (tar instanceof EventTarget) {
                if (tar.nodeType) {
                    var eName = event.type;

                    //判断自身是否有该事件触发
                    if (eName in tar && ("on" + eName) in tar) {
                        tar[eName]();
                        return;
                    }
                    //设置target
                    event.target = tar;

                    //手动模拟事件触发
                    var popTriggerEle = function(ele) {
                        prototypeObj._tr(ele, eName, event, data);

                        //没有阻止冒泡就继续往上触发
                        if (!event.cancelBubble) {
                            var parentNode = ele.parentNode;
                            if (parentNode && parentNode != DOCUMENT) { popTriggerEle(parentNode); }
                        }
                    };

                    //点火
                    popTriggerEle(tar);

                    //内存回收
                    popTriggerEle = null;
                } else {
                    //触发自定义事件
                    prototypeObj._tr(tar, eventName, event, data);
                }
            });
        },
        off: function(types, selector, fn) {
            return arrayEach(this, function(ele) {
                var smartEventData = ele[SMARTEVENTKEY];
                if (!smartEventData) return

                if (!types) {
                    for (var k in smartEventData) {
                        delete smartEventData[k];
                    }
                    return;
                }

                var arg2Type = getType(selector);
                arrayEach(types.split(' '), function(eventName) {
                    switch (getType(eventName)) {
                        case STR_string:
                            var smartEventData_eventName = smartEventData[eventName];
                            if (!selector) {
                                delete smartEventData[eventName];
                            } else if (arg2Type === STR_function) {
                                smartEventData[eventName] = smartEventData_eventName.filter(function(e) {
                                    return e.f === selector ? 0 : 1;
                                });
                            } else if (arg2Type === STR_string) {
                                if (!fn) {
                                    smartEventData[eventName] = smartEventData_eventName.filter(function(e) {
                                        return e.s === selector ? 0 : 1;
                                    });
                                } else {
                                    smartEventData[eventName] = smartEventData_eventName.filter(function(e) {
                                        return (e.s === selector && e.f === fn) ? 0 : 1;
                                    });
                                }
                            }
                            break;
                        case STR_object:
                            var _this;
                            objEach(eventName, function(k, v) {
                                _this.off(k, v);
                            });
                            return;
                    }
                });
            });
        },
        bind: function(event, data, callback) {
            //@use---$.fn.on
            return this.on(event, data, callback);
        },
        unbind: function(event, callback) {
            //@use---$.fn.off
            return this.off(event, callback)
        },
        triggerHandler: function(eventName, data) {
            //@use---$.fn._tr
            //@use---$.Event
            var tar = this[0];
            tar && prototypeObj._tr(tar, eventName, $.Event(eventName), data);
            return this;
        },
        delegate: function(selector, types, data, fn) {
            //@use---$.fn.on
            return this.on(types, selector, data, fn);
        },
        undelegate: function(selector, types, fn) {
            //@use---$.fn.off
            return this.off(types, selector, fn);
        },
        hover: function(fnOver, fnOut) {
            //@use---$.fn.on
            return this.on('mouseenter', fnOver).on('mouseleave', fnOut || fnOver);
        },
        clone: function(isDeep) {
            //@use---$.fn._tr
            //@use---$.Event
            var arr = [];

            //克隆自定义方法和自定义数据
            var mapCloneEvent = function(ele, tarele) {
                var customData = ele[SMARTKEY],
                    eventData = ele[SMARTEVENTKEY];

                if (eventData) {
                    //事件处理
                    objEach(eventData, function(eventName) {
                        tarele.addEventListener(eventName, function(oriEvent) {
                            prototypeObj._tr(tarele, eventName, $.Event(oriEvent));
                        });
                    });
                    tarele[SMARTEVENTKEY] = extend({}, eventData);
                }

                //设定数据
                customData && (tarele[SMARTKEY] = customData);

                //判断是否有children
                var childs = ele.children;
                var tarchild = tarele.children;
                if (childs.length) {
                    arrayEach(childs, function(e, i) {
                        mapCloneEvent(e, tarchild[i]);
                    });
                }
            };

            arrayEach(this, function(e) {
                var cloneEle = e.cloneNode(true);
                isDeep && mapCloneEvent(e, cloneEle);
                arr.push(cloneEle);
            });

            //回收
            mapCloneEvent = null;

            return $(arr);
        },
        add: function(expr, content) {
            var $this = this;
            arrayEach($(expr, content), function(e) {
                if ($this.indexOf(e) === -1) {
                    $this.push(e);
                }
            });
            return $this;
        },
        contents: function() {
            var arr = [];
            arrayEach(this, function(tar) {
                merge(arr, tar.childNodes);
            });
            return $(arr);
        },
        extend: function(obj) {
            extend(prototypeObj, obj);
        }
    });

    extend($, {
        each: function(obj, func) {
            if ("length" in obj && getType(obj) != STR_function) {
                return arrayEach(obj, function(e, i) {
                    func(i, e);
                });
            } else {
                return objEach(obj, func);
            }
        },
        when: function() {
            //函数容器
            var funcArr = [];
            var reobj = {
                then: function(func) {
                    funcArr.push(func);
                }
            };

            //数据容器
            var datas = [];

            //计数器
            var count = 0;

            //完成函数
            var okfun = function() {
                count--;
                if (count) {
                    return;
                }

                arrayEach(funcArr, function(func) {
                    func.apply(window, datas);
                });

                reobj = funcArr = datas = okfun = null;
            };

            var deferreds = makeArray(arguments);
            arrayEach(deferreds, function(e, i) {
                if (e instanceof $.Deferred) {
                    //属于自带deferreds
                    e.done(function(d) {
                        datas[i] = d;
                        okfun();
                    })
                } else if (window.Promise && e instanceof Promise) {
                    //原生Promise
                    e.then(function(d) {
                        datas[i] = d;
                        okfun();
                    });
                } else if (e._tasks) {
                    //拥有_task属性（animate之类的）
                    e._task.push(okfun);
                } else if (typeof e === STR_object) {
                    //自带对象
                    datas[i] = e;
                    setTimeout(okfun, 0);
                } else {
                    return;
                }
                count++;
            });

            return reobj;
        }
    });

    //@set---$.Event---start
    $.Event = function(oriEvent, props) {
        var _this = this;

        if (!(this instanceof $.Event)) {
            return new $.Event(oriEvent, props);
        } else if (oriEvent instanceof $.Event) {
            return oriEvent;
        }

        if (oriEvent && oriEvent.type) {
            //添加相关属性
            arrayEach(['altKey', 'bubbles', 'cancelable', 'changedTouches', 'ctrlKey', 'detail', 'eventPhase', 'metaKey', 'pageX', 'pageY', 'shiftKey', 'view', 'char', 'charCode', 'key', 'keyCode', 'button', 'buttons', 'clientX', 'clientY', 'offsetX', 'offsetY', 'pointerId', 'pointerType', 'relatedTarget', 'screenX', 'screenY', 'target', 'targetTouches', 'timeStamp', 'toElement', 'touches', 'which'], function(e) {
                (oriEvent[e] != UNDEFINED) && (_this[e] = oriEvent[e]);
            });

            //判断是否自定义事件
            _this.originalEvent = oriEvent;
        } else {
            this.type = oriEvent;
            props && extend(this, props);
        }


        this.returnValue = true;
        this.cancelBubble = false;

        _this.timeStamp || (_this.timeStamp = new Date().getTime());
    };
    //主体event对象
    $.Event.prototype = {
        isDefaultPrevented: function() {
            return this.returnValue === false;
        },
        isPropagationStopped: function() {
            return this.cancelBubble;
        },
        isImmediatePropagationStopped: function() {
            return !!this._ips;
        },
        preventDefault: function() {
            var originalEvent = this.originalEvent;
            originalEvent && originalEvent.preventDefault();
            this.returnValue = false;
        },
        stopPropagation: function() {
            var originalEvent = this.originalEvent;
            originalEvent && originalEvent.stopPropagation();
            this.cancelBubble = true;
        },
        stopImmediatePropagation: function() {
            var originalEvent = this.originalEvent;
            originalEvent && originalEvent.stopImmediatePropagation();
            this._ips = true;
        }
    };
    //@set------end

    //@set---$.fn.blur $.fn.focus $.fn.focusin $.fn.focusout $.fn.resize $.fn.scroll $.fn.click $.fn.dblclick $.fn.mousedown $.fn.mouseup $.fn.mousemove $.fn.mouseover $.fn.mouseout $.fn.mouseenter $.fn.mouseleave $.fn.change $.fn.select $.fn.submit $.fn.keydown $.fn.keypress $.fn.keyup $.fn.contextmenu---start
    //@use---$.fn.on
    //@use---$.fn.trigger
    //设置event
    arrayEach("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "), function(e) {
        prototypeObj[e] = function(callback) {
            callback ? this.on(e, callback) : this.trigger(e);
            return this;
        }
    });
    //@set------end

    //动画
    //@set---$.fn.animate $.fn.stop---start
    //获取立方根的方法
    var getCbrt = (function() {
        if (Math.cbrt) {
            return Math.cbrt;
        } else {
            return function(x) {
                var y = Math.pow(Math.abs(x), 1 / 3);
                return x < 0 ? -y : y;
            };
        }
    })();

    //动画函数主体
    prototypeObj.animate = function(prop, arg2, arg3, arg4) {
        var animateTime = 400,
            easing = 'swing',
            callback;
        var _this = this;
        //以下为增强选项
        var delay = 0,
            progress, start, queue = 1;

        //设置 _task array
        _this._tasks || (_this._tasks = []);

        //对齐参数
        switch (getType(arg2)) {
            case "number":
                animateTime = arg2
                if (getType(arg3) === STR_string) {
                    easing = arg3
                    callback = arg4;
                } else {
                    callback = arg3;
                }
                break;
            case STR_string:
                if (/\D/.test(arg2)) {
                    easing = arg2;
                    callback = arg3;
                    break;
                }
                arg2 = parseFloat(arg2);
            case STR_function:
                callback = arg2;
                break;
            case STR_object:
                arg2.duration && (animateTime = arg2.duration);
                arg2.easing && (easing = arg2.easing);
                arg2.complete && (callback = arg2.complete);
                arg2.delay && (delay = arg2.delay);
                arg2.start && (start = arg2.start);
                arg2.progress && (progress = arg2.progress);
                (arg2.queue != UNDEFINED) && (queue = arg2.queue)
                break;
        }

        //获取动画帧的方法
        var getFrame = function(t) {
            //默认就是得到返回的
            return t;
        };
        //判断是否有动画曲线
        if (easing && easing != "linear") {
            //得到坐标点
            var p1x, p1y, p2x, p2y;

            if (/cubic-bezier/.test(easing)) {
                //替换相应字符串
                easing = easing.replace('cubic-bezier(', "").replace(")", "");
                var easingArr = easing.split(',');
                //得到坐标点
                p1x = parseFloat(easingArr[0]);
                p1y = parseFloat(easingArr[1]);
                p2x = parseFloat(easingArr[2]);
                p2y = parseFloat(easingArr[3]);
            } else {
                switch (easing) {
                    case "ease":
                        p1x = 0.25, p1y = 0.1, p2x = 0.25, p2y = 1;
                        break;
                    case "ease-in":
                        p1x = 0.42, p1y = 0, p2x = 1, p2y = 1;
                        break;
                    case "ease-out":
                        p1x = 0, p1y = 0, p2x = 0.58, p2y = 1;
                        break;
                    case "swing":
                    case "ease-in-out":
                        p1x = 0.42, p1y = 0, p2x = 0.58, p2y = 1;
                        break;
                }
            }

            //筛选到最后，使用盛金公式法求解t
            //区间在0-1之间，t绝对不会出现负数或大于1的情况
            getFrame = function(tt) {
                if (tt === 0 || tt === 1) {
                    return tt;
                }
                var a = 1 + 3 * p1x - 3 * p2x;
                var b = 3 * p2x - 6 * p1x;
                var c = 3 * p1x;
                var d = -tt;

                var A = b * b - 3 * a * c;
                var B = b * c - 9 * a * d;
                var C = c * c - 3 * b * d;
                var delta = B * B - 4 * A * C;

                var t;
                if (delta > 0) {
                    var Y1 = A * b + 3 * a * (-B + Math.sqrt(delta)) / 2;
                    var Y2 = A * b + 3 * a * (-B - Math.sqrt(delta)) / 2;

                    //t只会在区间0-1，综合测试后得到的这个0到1区间的值
                    t = (-b - (getCbrt(Y1) + getCbrt(Y2))) / (3 * a);
                } else {
                    var Y = (2 * A * b - 3 * a * B) / (2 * Math.sqrt(A * A * A));
                    var angle = Math.acos(Y) / 3;
                    t = (-b + Math.sqrt(A) * (Math.cos(angle) - Math.sqrt(3) * Math.sin(angle))) / (3 * a);
                }
                var by = Math.pow(t, 3) + (3 * p1y * t * Math.pow(1 - t, 2)) + (3 * p2y * Math.pow(t, 2) * (1 - t));
                return by;
            };
        }

        var animationId;
        var funArr = [];

        var startTime;
        var animeFun = function(timestamp) {
            //记录开始时间
            startTime || (startTime = timestamp);

            //获取进度时间
            var diffTime = timestamp - startTime;

            //当前进度
            var nowPercentage = (diffTime > animateTime ? animateTime : diffTime) / animateTime;
            nowPercentage = getFrame(nowPercentage)
            funArr.forEach(function(e) {
                e(nowPercentage);
            });

            //运行进度函数
            progress && progress(nowPercentage);

            if (diffTime <= animateTime) {
                animationId = requestAnimationFrame(animeFun);
            } else {
                animateEnd(1);
            }
        };

        var animateEnd = function(isEnd) {
            //清除动画
            cancelAnimationFrame(animationId);

            if (isEnd) {
                funArr.forEach(function(e) {
                    e(1);
                });
                callback && callback();
            }

            //内存回收
            callback = funArr = getFrame = animeFun = null;
            delete _this._aEnd;

            //有下一个任务就运行下一个任务
            if (queue) {
                var nextTask = _this._tasks.shift();
                if (nextTask) {
                    nextTask(0);
                } else {
                    delete _this._tasks;
                    delete _this._isRT;
                }
            }
            _this = null;
        };

        var runanime = function() {
            _this._aEnd = animateEnd;

            //添加运行函数
            arrayEach(_this, function(tar) {
                var computeStyleObj = getComputedStyle(tar);
                objEach(prop, function(name, value) {
                    //获取当前值
                    var nowValue = parseFloat(computeStyleObj[name]);

                    if (nowValue) {
                        //修正值
                        value = parseFloat(value);

                        //获取差值
                        var diffVal = value - nowValue;

                        funArr.push(function(p) {
                            //设置当前值
                            tar.style[name] = nowValue + diffVal * p + "px";
                        });
                    } else {
                        nowValue = tar[name];

                        //获取差值
                        var diffVal = value - nowValue;

                        funArr.push(function(p) {
                            //设置当前值
                            tar[name] = nowValue + diffVal * p;
                        });
                    }
                });
            });

            setTimeout(function() {
                start && start();
                animeFun && animeFun(0);
            }, delay);
        };

        if (!_this._isRT || !queue) {
            runanime();
        } else {
            _this._tasks.push(runanime);
        }

        //设置动画进程开始
        _this._isRT = 1;

        return this;
    };

    prototypeObj.stop = function(clearQueue, gotoEnd) {
        if (clearQueue) {
            this._tasks = [];
        }
        var aEndArg = 0;
        gotoEnd && (aEndArg = 1);
        this._aEnd(aEndArg);
    }
})(window);
(function(glo, $) {
    "use strict";
    // base
    // 主体映射tag数据
    var tagDatabase = {};
    window.tagDatabase = tagDatabase;
    var afterFuncs = {};

    // function
    var makearray = $.makearray;
    var getType = $.type;
    var each = $.each;
    var merge = $.merge;
    var hasAttr = function(e, attrName) {
        if (!e.getAttribute) {
            return false;
        }
        var attr = e.getAttribute(attrName);
        if (attr !== null && attr !== undefined) {
            return true;
        }
    };
    var isSvShadow = function(e) {
        return hasAttr(e, "sv-shadow");
    };

    //判断元素是否符合条件
    var judgeEle = function(ele, expr) {
        var fadeParent = document.createElement('div');
        if (ele === document) {
            return false;
        }
        fadeParent.appendChild(ele.cloneNode(false));
        return 0 in $$(expr, fadeParent) ? true : false;
    };

    // 获取注册元素名
    var getRenderTagName = function(ele) {
        return ele.getAttribute('sv-is') || ele.tagName.toLowerCase()
    }

    //获取tagdata
    var getTagData = function(tagname) {
        return tagDatabase[tagname] || (tagDatabase[tagname] = $({}));
    };

    //转换字符串到html对象
    var transToEles = function(str) {
        var par = document.createElement('div');
        par.innerHTML = str;
        var ch = makearray(par.childNodes);
        par.innerHTML = "";
        return ch.filter(function(e) {
            var isInText = e instanceof Text;
            if ((isInText && e.textContent) || !isInText) {
                return e;
            }
        });
    };

    // class
    var $_fn = $.fn;
    var bInit = $_fn.init;
    //还原一个无影响的smartJQ
    var smartJQ = function(selector, context) {
        var obj = this.init(selector, context);

        // 判断是否sv-render元素，是的话返回一个 svRender 对象
        if (obj.length === 1 && obj[0].svRender) {
            var svdata = obj[0]._svData;
            if (svdata) {
                return svdata.init(obj[0]);
            }
        }

        return obj;
    };
    var bfn = Object.create($_fn);
    bfn.init = bInit;
    bfn.realFind = function(expr) {
        return $$(expr, this[0]);
    };
    smartJQ.prototype = bfn;
    var $$ = function(s, e) {
        return new smartJQ(s, e);
    };

    // SmartView 的原型链对象
    var SmartViewFn = Object.create($_fn);
    $.extend(SmartViewFn, {
        // 生成实例函数
        init: function(ele) {
            // 添加元素
            var tar = Object.create(this);
            tar.push(ele);
            return tar;
        },
        // 检测数值变动
        watch: function(keyname, callback, times) {
            if (times === 0) {
                // 注册0次的请打死他
                return;
            }

            if (getType(keyname) === "object") {
                var _this = this;
                each(keyname, function(k, c) {
                    _this.watch(k, c);
                });
                _this = null;
            } else if (keyname && callback) {
                var tars = this._watchs[keyname] || (this._watchs[keyname] = []);
                tars.push({
                    t: times || Infinity,
                    c: callback
                });
            }
        },
        // 取消检测变动函数
        unwatch: function(keyname, callback) {
            if (keyname) {
                if (callback) {
                    var tars = this._watchs[keyname];
                    var id = tars.indexOf(callback);
                    tars.splice(id, 1);
                } else {
                    this._watchs[keyname] = [];
                }
            }
        },
        // 真实查找
        realFind: function(expr) {
            return $$(expr, this[0]);
        },
        svRender: 2
    });

    // smartView的set方法
    var smartView_set = function(k, value) {
        //判断是否存在，不存在才设定
        // if (k in this) {
        //     console.warn('the value has been setted');
        //     this[k] = value;
        // } else {
        this._data[k] = value;
        Object.defineProperty(this, k, {
            get: function() {
                return this._data[k];
            },
            set: function(val) {
                // 分为私有和公用的
                var data = {
                    // before
                    b: this._data[k],
                    // after
                    a: val
                };
                var _this = this;

                // 触发修改数据事件
                _this.triggerHandler("_sv_c_" + k, data);

                // 触发 watch 绑定事件
                var tars = _this._watchs[k];
                var new_tars = [];
                if (tars) {
                    tars.forEach(function(e) {
                        if (e.t > 0) {
                            e.t--;
                        }
                        e.c.call(_this, val, _this._data[k]);
                        if (e.t > 0) {
                            new_tars.push(e);
                        }
                    });
                }
                _this._watchs[k] = new_tars;

                // 设置真实值
                _this._data[k] = val;

                // _this = null;
            }
        });
        // }
    };

    // 生成专用smartview Class
    var createSmartViewClass = function(proto) {
        // SmartView 的原型链对象
        var SmartView = function() {
            //绑定设定数据方法
            this.set = smartView_set.bind(this);
            this._watchs = [];
            this._data = {};
        };

        // 继承方法
        var nFn = Object.create(SmartViewFn);
        $.extend(nFn, proto || {});

        SmartView.prototype = nFn;

        return SmartView;
    };

    // main
    //渲染元素
    var renderEle = function(ele) {
        //判断是否渲染
        var isRender = ele.svRender;
        var tagName = getRenderTagName(ele);

        //获取注册信息
        var tagdata = getTagData(tagName);

        // 判断父层没有sv-register
        var par = ele,
            hasReg;
        do {
            par = par.parentNode;
            hasReg = par && hasAttr(par, 'sv-register');
        }
        while (!hasReg && par && par !== document.body)
        if (hasReg) {
            return;
        }

        // 确认没有渲染
        // 确认依赖加载完成
        if (!isRender) {
            // 渲染的函数
            var renderFunc = function() {
                // 获取childNode
                var childNodes = makearray(ele.childNodes);

                // 填充元素
                ele.innerHTML = tagdata.code;

                // 渲染数据对象
                var svFnData = new tagdata.sv();
                ele._svData = svFnData;

                // 初始化$content
                var $content = ele.querySelector('[sv-content]');
                if ($content) {
                    svFnData.$content = $$($content);
                }

                // 渲染依赖的子定义对象
                if (tagdata.relys.length) {
                    each(tagdata.relys, function(i, e) {
                        // 渲染内部元素
                        $(e + '[sv-ele]', ele);
                    });
                }

                // 还原元素
                childNodes && childNodes.forEach(function(element) {
                    $content && $content.appendChild(element);
                });

                // 初始化 sv-span 元素
                var svspans = svFnData._svspan = {};
                each(ele.querySelectorAll('sv-span'), function(i, e) {
                    // 替换sv-span
                    var textnode = document.createTextNode("");
                    e.parentNode.insertBefore(textnode, e);
                    e.parentNode.removeChild(e);
                    textnode.tagcode = e.outerHTML;

                    // 注册文本节点
                    var svkey = e.getAttribute('svkey');
                    var arr = svspans[svkey] || (svspans[svkey] = []);
                    arr.push(textnode);
                });

                // 初始设定空值
                // 绑定text节点
                var svEle = svFnData.init(ele);
                each(tagdata.data, function(k, v) {
                    // 设定需要监听的key
                    svEle.set(k);

                    // 绑定值修改文本事件 和 绑定watch事件
                    svEle.on('_sv_c_' + k, function(e, data) {
                        // 修正textEle
                        var textEles = svspans[k];
                        textEles && textEles.forEach(function(e) {
                            (e.textContent = data.a)
                        });
                    });
                });

                // 绑定sv-module
                svEle.realFind('[sv-module]').each(function() {
                    var $this = $$(this);
                    var k = this.getAttribute('sv-module');

                    //判断是否存在，不存在就set
                    if (!(k in svEle)) {
                        svEle.set(k, "");
                    }

                    $this.on('input', function() {
                        svEle[k] = this.value;
                    });

                    //绑定相对定义值
                    svEle.on('_sv_c_' + k, function(e, data) {
                        $this.val(data.a);
                    });

                    // 替换sv-module标识为sv-render-module
                    this.removeAttribute('sv-module');
                    this.setAttribute('sv-render-module', k)
                });

                // 获取sv-tar值
                svEle.realFind('[sv-tar]').each(function() {
                    var $ele = $$(this);
                    var sv_tar = $ele.attr('sv-tar');
                    sv_tar && (svFnData['$' + sv_tar] = $ele);
                });

                // 绑定value
                if (tagdata.val) {
                    var eleVal = "";
                    Object.defineProperty(ele, "value", {
                        set: function(val) {
                            svEle[tagdata.val] = val;
                            eleVal = val;
                        },
                        get: function() {
                            return eleVal;
                        }
                    });
                    svEle.on('_sv_c_' + tagdata.val, function(e, data) {
                        eleVal = data.a;
                    });
                }

                // 绑定watch对象
                tagdata.watch && svEle.watch(tagdata.watch);

                // 绑定attrs数据
                tagdata.attrs && tagdata.attrs.forEach(function(k) {
                    // 属性绑定
                    svEle.on('_sv_c_' + k, function(e, data) {
                        // 绑定属性
                        ele.setAttribute(k, data.a);
                    });

                    // 先判断有没有data注册
                    if (tagdata.data[k] === undefined) {
                        svEle.set(k);
                    }

                    var attrValue = ele.getAttribute(k);

                    // 判断是否自定义属性，具有优先级别
                    if (attrValue) {
                        svEle[k] = attrValue;
                    } else if (tagdata.data[k] !== undefined) {
                        // 代替data设置
                        svEle[k] = tagdata.data[k];
                    }
                });

                // 设置props数据
                tagdata.props && tagdata.props.forEach(function(e) {
                    var attrValue = ele.getAttribute(e);
                    if (attrValue) {
                        // 先判断有没有data注册
                        if (tagdata.data[e] === undefined) {
                            svEle.set(e);
                        }
                        //设置值
                        svEle[e] = attrValue;
                    }
                });

                // 设定值
                each(tagdata.data, function(k, v) {
                    if (typeof v === "object") {
                        v = JSON.parse(JSON.stringify(v));
                    }
                    // 如果不在 attrs 或 props 上在设定
                    if (tagdata.attrs.indexOf(k) == -1 && tagdata.props.indexOf(k) == -1) {
                        svEle[k] = v;
                    }
                });

                // 设置已渲染信息
                ele.setAttribute('sv-render', 1);
                ele.svRender = 1;

                // 去除渲染前标识
                ele.removeAttribute('sv-ele');

                // 执行render函数
                tagdata.render(svEle);

                // 判断是否extend扩展函数
                var extendTagData = afterFuncs[tagName];
                if (extendTagData) {
                    extendTagData.forEach(function(e) {
                        e.render(svEle);
                    });
                }
            }

            // 设置别渲染了哈
            ele.svRender = 9;

            if (tagdata.relyOk) {
                renderFunc();
                renderFunc = null;
            } else {
                tagdata.one('canRender', function() {
                    renderFunc();
                    renderFunc = null;
                });
            }
        }
    };

    //注册元素的方法
    var register = function(options) {
        var defaults = {
            // 模板元素
            // ele: "",
            name: "",
            template: "",
            // 需要动态更新监听的属性
            attrs: [],
            // 需要挂载数据的属性
            props: [],
            // 绑定元素value值的属性名
            val: "",
            //自带默认数据
            data: {},
            // 原型链对象，不会被监听
            proto: "",
            // 直接绑定属性变化函数，在设置data的时候就会开始触发
            // watch:{},
            //每次初始化都会执行的函数
            render: function() {}
        };
        // 合并选项
        $.extend(defaults, options);

        //获取tag
        var tagname, code, ele;
        if (defaults.template) {
            ele = $(defaults.template)[0];
        } else if (defaults.name) {
            ele = $('[sv-register="' + defaults.name + '"]')[0];
        } else {
            console.error('register data error');
            return;
        }

        // 需要注册的tag名
        tagname = ele.getAttribute('sv-register') || getRenderTagName(ele);

        // 把子元素有内容的textNode转换成spanNode
        var childnodes = ele.childNodes;
        each(childnodes, function(i, e) {
            if (e instanceof Text && e.textContent.trim()) {
                var spanNode = document.createElement('span');
                spanNode.textContent = e.textContent;
                ele.insertBefore(spanNode, e);
                ele.removeChild(e);
            }
        });

        // 所有内元素添加sv-shadow
        each(ele.querySelectorAll("*"), function(i, e) {
            e.setAttribute('sv-shadow', "");
        });

        code = ele.innerHTML;

        // 去除无用的代码（注释代码）
        code = code.replace(/<!--.+?-->/g, "");

        //准换自定义字符串数据
        var darr = code.match(/{{.+?}}/g);
        darr && darr.forEach(function(e) {
            var key = /{{(.+?)}}/.exec(e);
            if (key) {
                code = code.replace(e, '<sv-span sv-shadow svkey="' + key[1].trim() + '"></sv-span>');
            }
        });

        // 获取依赖tag
        var relys = [];
        var relyEles = ele.querySelectorAll('[sv-ele]');
        each(relyEles, function(i, e) {
            var tagname = e.tagName.toLowerCase();
            if (relys.indexOf(tagname) == -1) {
                relys.push(tagname);
            }
        });

        //注册数据
        var tagdata = getTagData(tagname);
        $.extend(tagdata, {
            tagname: tagname,
            code: code,
            attrs: defaults.attrs,
            props: defaults.props,
            data: defaults.data,
            render: defaults.render,
            val: defaults.val,
            watch: defaults.watch,
            sv: createSmartViewClass(defaults.proto),
            // 所有依赖的自定义tag
            relys: relys,
            // 依赖的tag是否完成
            // relyOk: 1
        });

        if (0 in relys) {
            // 设置依赖还没完成
            tagdata.relyOk = 0;

            // 根据依赖tag绑定依赖事件
            var c = relys.length;
            each(relys, function(i, e) {
                var tdata = getTagData(e);
                if (tdata.relyOk) {
                    c--;
                    if (c === 0) {
                        tagdata.relyOk = 1;
                        tagdata.trigger('canRender');
                    }
                } else {
                    tdata.one('canRender', function() {
                        c--;
                        if (c === 0) {
                            tagdata.relyOk = 1;
                            tagdata.trigger('canRender');
                        }
                    });
                }
            });
        } else {
            tagdata.relyOk = 1;
            // 触发可以渲染的事件
            tagdata.trigger('canRender');
        }

        //获取需要渲染的元素进行渲染
        $$(tagname + '[sv-ele]').each(function(i, e) {
            // 不在sv-register内就可以渲染
            renderEle(e);
        });
    };

    // 修正原jquery方法
    // 监听初始化jQuery函数，修正返回的实例对象
    // 在判断是只有一个 sv元素的时候，返回sv实例对象
    $_fn.init = function(selector, context) {
        // 继承先前的方法
        var obj = bInit.call(this, selector, context);

        // 主动渲染 sv-ele 元素
        // 并判断是否拥有sv-shadow元素，做好重新初始化工作
        var has_shadow = 0;
        var notShadowEle = [];
        obj.each(function(i, e) {
            //判断当前是否拥有 sv-shadow 元素
            if (isSvShadow(e)) {
                has_shadow = 1;
            } else {
                notShadowEle.push(e);
            }

            if (e.getAttribute && e.getAttribute('sv-ele') === "") {
                renderEle(e);
            }

            //判断是否有子未渲染元素
            var subEle = e.querySelectorAll && e.querySelectorAll('[sv-ele]');
            subEle && each(subEle, function(i, e) {
                renderEle(e);
            });
        });

        // 过滤 sv-shadow 元素
        if (has_shadow) {
            obj = $$(notShadowEle);
        }
        notShadowEle = null;

        // 判断是否sv-render元素，是的话返回一个 svRender 对象
        if (obj.length === 1 && obj[0].svRender) {
            var svdata = obj[0]._svData;
            if (svdata) {
                return svdata.init(obj[0]);
            }
        }

        return obj;
    };

    // 修改attr方法，设置属性前判断是否有绑定属性变量
    var o_attr = $.fn.attr;
    $.fn.attr = function(name, value) {
        if (value !== undefined) {
            each(this, function(i, e) {
                if (e.svRender) {
                    var tagname = getRenderTagName(e);
                    var tagdata = getTagData(tagname);
                    if (tagdata.attrs.indexOf(name) > -1) {
                        $(e)[name] = value;
                    }
                } else {
                    o_attr.call($$(e), name, value);
                }
            });
            return this;
        } else {
            return o_attr.call(this, name, value);
        }
    };

    // 扩展其他方法
    // 关键的 clone 方法
    var o_clone = $.fn.clone;
    $.fn.clone = function(isDeep) {
        var reObj = [];

        this.each(function(i, e) {
            // 判断是否渲染元素
            if (e.svRender) {
                var nEle = e.cloneNode();
                nEle.innerHTML = $$(e).html();

                // 渲染并设置新值
                renderEle(nEle);

                var $nEle = $(nEle);
                each(e._svData._data, function(k, v) {
                    $nEle[k] = v;
                });

                // 先获取组团的元素
                var cEles = $$('[sv-render]', e);

                // 渲染内部元素，并设置相同的data
                $$('[sv-render]', nEle).each(function(i, e) {
                    renderEle(e);

                    var mapTar = cEles[i];

                    var $e = $(e);

                    // 接替数据
                    each(mapTar._svData._data, function(k, v) {
                        (v !== undefined) && ($e[k] = v);
                    });
                });

                // 加入队列
                reObj.push(nEle);

                // 不要你们了
                nEle = $nEle = cEles = null;
            } else {
                // 不是的话就直接旧式拷贝
                reObj.push(o_clone.call($$(e), isDeep)[0]);
            }
        });

        return $(reObj);
    };

    // 关键 parent 方法
    // unwrap
    // var o_parent = $.fn.parent;
    $.fn.parent = function(expr) {
        var arr = [];
        this.each(function(i, e) {
            var par;
            if (isSvShadow(e)) {
                par = e.parentNode;
            } else {
                do {
                    par = e.parentNode;
                    e = par;
                }
                while (isSvShadow(par))
            }

            // expr
            if ((!expr || (expr && judgeEle(par, expr))) && arr.indexOf(par) == -1) {
                arr.push(par);
            }

        });
        return $$(arr);
    };

    // children
    var o_children = $.fn.children;
    $.fn.children = function(expr) {
        var arr = [];
        this.each(function(i, e) {
            var rearr;
            if (e.svRender && e._svData.$content) {
                rearr = o_children.call(e._svData.$content, expr);
            } else {
                rearr = o_children.call($$(e), expr);
            }
            merge(arr, rearr);
        });
        return $(arr);
    };

    var n_ec = function(tar, func) {
        // 重新过滤元素
        var lastId = this.length - 1;

        var isfunction;
        switch (getType(tar)) {
            case "function":
                isfunction = 1;
                break;
            case "string":
                tar = $(transToEles(tar));
                break;
            default:
                tar = $(tar);
        }

        this.each(function(i, e) {
            if (isfunction) {
                var redata, $e = $(e);
                if (e.svRender) {
                    redata = tar(i, $e.html());
                } else {
                    redata = tar(i, $e.html());
                }
                if (redata) {
                    $e.append(redata);
                }
            } else {
                var ele = tar;
                if (lastId !== i && tar instanceof $) {
                    ele = tar.clone();
                }

                func(e, ele);
            }
        });
    };

    // append prepend appendTo prependTo wrapInner
    ['append', 'prepend', 'wrapInner'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(tar) {
            n_ec.call(this, tar, function(e, tar) {
                // if ((isSvShadow(e) && !hasAttr(e, 'sv-content')) || hasAttr(e, "sv-render")) {
                if ((isSvShadow(e) && !hasAttr(e, 'sv-content'))) {
                    tar[0] && tar[0].setAttribute('sv-shadow', "");
                }
                if (e.svRender && e._svData.$content) {
                    o_func.call(e._svData.$content, tar);
                } else {
                    o_func.call($$(e), tar);
                }
            });
            return this;
        };
    });

    // wrap
    var o_wrap = $.fn.wrap;
    $.fn.wrap = function(tar) {
        n_ec.call(this, tar, function(e, tar) {
            if (isSvShadow(e)) {
                tar[0] && tar[0].setAttribute('sv-shadow', "");
            }
            if (tar.svRender) {
                e.parentNode.insertBefore(tar[0], e);
                tar.append(e);
            } else {
                o_wrap.call($$(e), tar);
            }
        });
        return this;
    };

    // after before replaceWith replaceAll
    ['after', 'before'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(tar) {
            n_ec.call(this, tar, function(e, tar) {
                if (isSvShadow(e)) {
                    tar[0] && tar[0].setAttribute('sv-shadow', "");
                }
                o_func.call($$(e), tar);
            });
            return this;
        };
    });

    // html text
    ['html', 'text'].forEach(function(e) {
        var o_func = $.fn[e];
        $.fn[e] = function(ele) {
            if (ele) {
                this.each(function(i, e) {
                    // 运行独立函数
                    if (e.svRender && e._svData.$content) {
                        o_func.call(e._svData.$content, ele);
                    } else {
                        o_func.call($$(e), ele);
                    }
                });

                // 渲染需要渲染的节点
                $('[sv-ele]');

                return this;
            } else {
                // 目标元素
                var tar = this[0];

                if (tar && tar.svRender) {
                    // 复制 $content 内的元素
                    tar = tar._svData.$content;

                    if (!tar) {
                        return "";
                    }

                    tar = tar[0].cloneNode(true);

                    // 查找所有元素
                    $$('[sv-shadow]', tar).each(function(i, e) {
                        // 一开始本来就是sv-content的暂时保留
                        if (hasAttr(e, "sv-content")) {
                            return;
                        }

                        // 判断当前的元素父层没有
                        // 遍历这个元素的父层，如果先判断到出现sv-render就删除，判断到sv-content就保留
                        var canout = 0,
                            par = e;
                        do {
                            par = par.parentNode;
                            if (!par) {
                                // 到顶层的跳出循环
                                canout = 1;
                            } else if (hasAttr(par, "sv-render")) {
                                // sv-render内的可以删掉
                                $$(e).remove();
                                canout = 1;
                            } else if (hasAttr(par, "sv-content")) {
                                // sv-content内的可以保留
                                canout = 1;
                            }
                        }
                        while (!canout)
                    });

                    // 替换掉sv-content的内容到外面
                    $$('[sv-content]', tar).each(function(i, e) {
                        if (0 in e.childNodes) {
                            var childs = makearray(e.childNodes);
                            var par = e.parentNode;

                            // 置换内容
                            each(childs, function(i, e2) {
                                par.insertBefore(e2, e);
                            });
                            par.removeChild(e);
                        }
                    });

                    // 替换sv-render为sv-ele
                    $$(tar, '[sv-render]').each(function(i, e) {
                        e.removeAttribute('sv-render');
                        e.setAttribute('sv-ele', "");
                    });
                }

                return o_func.call($$(tar));
            }
        }
    });

    // empty
    $.fn.empty = function() {
        each(this, function(i, e) {
            if (e.svRender && e._svData.$content) {
                e._svData.$content[0].innerHTML = "";
            } else {
                e.innerHTML = "";
            }
        });
        return this;
    };

    // init
    var sv = {
        // 暴露注册插件的方法
        register: register,
        // 简单的后续扩展插件的方法
        after: function(options) {
            var defaults = {
                // 注册的tag
                tag: "",
                // 每次初始化都会执行的函数
                render: ""
            };
            // 合并选项
            $.extend(defaults, options);

            // 判断并加入数据对象
            var extendTagData = afterFuncs[defaults.tag] || (afterFuncs[defaults.tag] = []);

            extendTagData.push(defaults);
        },
        init: function(ele) {
            var svdata = ele._svData;
            if (svdata) {
                return svdata.init(ele);
            }
        },
        // 扩展方法
        extend: function(func) {
            func(tagDatabase);
        },
        // 是否 shear元素
        is: function() {}
    };

    glo.shear = sv;

    // 程序加载完成后，执行以下初始化
    $(function() {
        $('[sv-ele]');
    });
})(window, window.$);