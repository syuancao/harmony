// 应用中所有的用户界面元素都是由Component和ComponentGroup对象构成。
// Component是绘制在屏幕上的一个对象，用户能与之交互。
// ComponentGroup是一个用于容纳其他Component和ComponentGroup对象的容器。

// Harmony UI框架提供了一部分Component和ComponentGroup的具体子类，
// 即创建用户界面（UI）的各类组件
// 包括一些常用的组件（比如：文本、按钮、图片、列表等）和常用的布局（比如：DirectionalLayout和DependentLayout）。
// 用户可通过组件进行交互操作，并获得响应。
// 所有的UI操作都应该在主线程进行设置。

// 设备显示指标
function _DisplayMetrics() {
    // 设备密度
    this.density = window.devicePixelRatio
}

var DisplayMetrics = new _DisplayMetrics()

// 改变密度，此处使用canvas来生成一张视图。
var changeDensity = function (c) {
    if (c.width == 0 || c.height == 0) {
        return
    }
    var wPx = c.width + 'px'
    var hPx = c.height + 'px'
    if (c.style.width != wPx) {
        c.style.width = wPx
    }
    if (c.style.height != hPx) {
        c.style.height = hPx
    }

    var density = DisplayMetrics.density
    c.width = Math.ceil(c.width * density)
    c.height = Math.ceil(c.height * density)
    var ctx = c.getContext('2d')
    ctx.scale(density, density)
}

Object.defineProperty(Component, "NO_ID", { value: -1 })
Object.defineProperty(Component, "VISIBLE", { value: 0 })
Object.defineProperty(Component, "INVISIBLE", { value: 4 })
Object.defineProperty(Component, "GONE", { value: 8 })
Object.defineProperty(Component, "VIEW_STATE_ENABLED", { value: (1 << 3) })
Object.defineProperty(Component, "VIEW_STATE_PRESSED", { value: (1 << 4) })

// Component提供内容显示，是界面中所有组件的基类
function Component() {
    var $ = this
    $.div = document.createElement("div")

    $.l = 0
    $.t = 0
    $.r = 0
    $.b = 0
    $.w = 0
    $.h = 0

    $.borderL = 0
    $.borderT = 0
    $.borderR = 0
    $.borderB = 0

    var parent
    var width = 0
    var height = 0
    var wMS = 0x80000000
    var hMS = 0x80000000
    var bg = 0
    var pL = 0
    var pT = 0
    var pR = 0
    var pB = 0
    var scrollX = 0
    var scrollY = 0
    var lp = null
    var willNotDraw = true
    var visibility = View.VISIBLE
    var clickable = false
    var longClickable = false
    var clickListener = null
    var longClickListener = null
    var tag = "View"
    var id = View.NO_ID
    var HTMLCanvas = null
    var canvas = null
    var preventHtmlTouchEvent = true
    var forceArrange = false
    var arrangeRequired = false
    var isPressed = false
    var prePressed = false
    var animation = null

    var downX, downY
    var hasPerformedLongPress = false

    var runQueue = {}

    var andList = []

    $.getId = function () {
        return id
    }

    $.setId = function (_id) {
        id = _id
        return $
    }

    $.id = function (_id) {
        if (_id == undefined) {
            return id
        }
        return $.setId(_id)
    }

    $.getTag = function () {
        return tag
    }

    $.setTag = function (t) {
        tag = t
        $.div.setAttribute("Tag", t)
        return $
    }

    $.tag = function (t) {
        if (t == undefined) {
            return tag
        }
        return $.setTag(t)
    }

    $.getParent = function () {
        return parent
    }

    $.setParent = function (p) {
        parent = p
    }

    $.parent = function (p) {
        if (p == undefined) {
            return parent
        }
        return $.setParent(p)
    }

    $.getPaddingLeft = $.getPL = $.pl = function () {
        return pL
    }

    $.getPaddingTop = $.getPT = $.pt = function () {
        return pT
    }

    $.getPaddingRight = $.getPR = $.pr = function () {
        return pR
    }

    $.getPaddingBottom = $.getPB = $.pb = function () {
        return pB
    }

    $.setPadding = $.padding = function (l, t, r, b) {
        if (t == undefined && r == undefined && b == undefined) {
            t = l
            r = l
            b = l
        }
        pL = l
        pT = t
        pR = r
        pB = b
        return $
    }

    $.setMargins = $.margins = $.margin = function (l, t, r, b) {
        if (t == undefined && r == undefined && b == undefined) {
            t = l
            r = l
            b = l
        }
        if (!lp) {
            lp = new LP(LP.WC, LP.WC)
        }
        lp.setMargins(l, t, r, b)
        return $
    }

    $.getLP = $.getLayoutParams = function () {
        return lp
    }

    $.setLP = $.setLayoutParams = function (lpOrW, h) {
        if (h) {
            lp = new LP(lpOrW, h)
        } else {
            lp = lpOrW
        }
        return $
    }

    $.lp = function (lpOrW, h) {
        if (lpOrW == undefined) {
            return lp
        }
        return $.setLP(lpOrW, h)
    }

    $.getLeft = $.left = function () {
        return $.l
    }

    $.getRight = $.right = function () {
        return $.l + $.mw()
    }

    $.getTop = $.top = function () {
        return $.t
    }

    $.getBottom = $.bottom = function () {
        return $.b
    }

    $.getWidth = $.width = function () {
        return $.w
    }

    $.getHeight = $.height = function () {
        return $.h
    }

    $.getMeasuredWidth = $.getMW = $.mw = function () {
        return $.w
    }

    $.getMeasuredHeight = $.getMH = $.mh = function () {
        return $.h
    }

    $.getScrollX = function () {
        return scrollX
    }

    $.setScrollX = function (x) {
        scrollX = x
    }

    $.scrollX = function (x) {
        if (x == undefined) {
            return scrollX
        }
        scrollX = x
    }

    $.getScrollY = function () {
        return scrollY
    }

    $.setScrollY = function (y) {
        scrollY = y
    }

    $.scrollY = function (y) {
        if (y == undefined) {
            return scrollY
        }
        scrollY = y
    }

    $.getHitRect = function (outRect) {
        outRect.set($.l, $.t, $.r, $.b)
    }

    // 测量组件的大小以确定宽度和高度。
    $.setES = $.setEstimatedSize = function (w, h) {
        if ($.w == w && $.h == h) {
            return
        }
        $.w = w
        $.h = h
        $.div.style.width = w + "px"
        $.div.style.height = h + "px"
        if (HTMLCanvas !== null) {
            HTMLCanvas.width = w
            HTMLCanvas.height = h
            changeDensity(HTMLCanvas)
        }
    }

    // 设置测量的宽度和高度
    $.onEstimateSize = function (wMS, hMS) {
        $.setES(MS.getSize(wMS), MS.getSize(hMS))
    }

    // 设置测量组件的侦听器
    $.setEstimateSizeListener = function (_wMS, _hMS) {
        if (_wMS == undefined) {
            _wMS = 0
        }
        if (_hMS == undefined) {
            _hMS = _wMS
        }
        if (forceArrange || _wMS != wMS || _hMS != hMS) {
            wMS = _wMS
            hMS = _hMS
            $.onEstimateSize(_wMS, _hMS)

            arrangeRequired = true
        }

        for (var i = 0; i < andList.length; i++) {
            var v = andList[i]
            v.measure(_wMS, _hMS)
        }
        andList = []
    }

    // 相对于容器组件设置组件的位置和大小, arrange翻译为布置
    $.arrange = function (x, y) {
        if (arrangeRequired || $.l != x || $.t != y || $.r != (x + $.w) || $.b != (y + $.h)) {
            if (parent) {
                if (x == left) {
                    x = 0
                } else if (x == right) {
                    x = parent.w - $.w
                } else if (x == center) {
                    x = (parent.w - $.w) / 2
                }

                if (y == top) {
                    y = 0
                } else if (y == bottom) {
                    y = parent.h - $.h
                } else if (y == center) {
                    y = (parent.h - $.h) / 2
                }
            }

            $.l = x
            $.t = y
            $.r = x + $.w
            $.b = y + $.h

            $.div.style.left = x + "px"
            $.div.style.top = y + "px"

            $.onArrange(x, y)
            $.invalidate()
            arrangeRequired = false
        }
        forceLayout = false

        for (var i = 0; i < andList.length; i++) {
            var v = andList[i]
            v.arrange(x, y)
        }
        andList = []
    }
}

// ComponentGroup：作为容器容纳Component或ComponentGroup对象，并对它们进行布局。
// Harmony UI框架提供了一些标准布局功能的容器，它们继承自ComponentGroup，一般以“Layout”结尾，如DirectionalLayout、DependentLayout等。
function ComponentGroup() {
    View.apply(this)

    var $ = this
}

// 布局把Component和ComponentGroup以树状的层级结构进行组织，这样的一个布局就称为组件树。组件树的特点是仅有一个根组件，
// 其他组件有且仅有一个父节点，组件之间的关系受到父节点的规则约束。