//放烟花
function playFire() {
    var fgm = {
        bind: function (object, handler) {//令handler.this=object
            return function () {
                return handler.apply(object, arguments)
            }
        },
        randomRange: function (lower, upper) {//产生范围在lower~upper的随机数
            return Math.floor(Math.random() * (upper - lower + 1) + lower)
        },
        getRanColor: function () { //随机获得十六进制颜色
            var str = this.randomRange(0, 0xFFFFFF).toString(16);
            while (str.length < 6) str = "0" + str;
            return "#" + str
        }
    };

    //初始化对象
    function FireWorks() {
        this.type = 0;
        this.timer = null;
    }
    FireWorks.prototype = {
        initialize: function () {
            clearTimeout(this.timer);//清除计时器时间
            this.auto();
        },
        manual: function (event) {//存储鼠标位置
            event = event || window.event;
            this.__create__({
                x: event.clientX,
                y: event.clientY
            });
        },

        auto: function () {//产生x,y随机数
            var that = this;
            that.timer = setTimeout(function () {
                that.__create__({
                    x: fgm.randomRange(50, document.documentElement.clientWidth - 50),
                    y: fgm.randomRange(50, document.documentElement.clientHeight - 150)
                })
                that.auto();
            }, fgm.randomRange(900, 1100))
        },
        __create__: function (param) {
            //param即鼠标点击点（即烟花爆炸点）
            var that = this;
            var oEntity = null;
            var oChip = null;
            var aChip = [];
            var timer = null;
            var oFrag = document.createDocumentFragment();

            oEntity = document.createElement("div");
            with (oEntity.style) { //烟花上升过程实体初始化
                position = "absolute";
                //初始位置距网页顶部为：整个网页的高度（处于网页底部）
                top = document.documentElement.clientHeight + "px";
                left = param.x + "px";
                width = "4px";
                height = "30px";
                borderRadius = "4px";
                background = fgm.getRanColor();
            };
            document.body.appendChild(oEntity);
            //window.setInterval方法 该方法使得一个函数每隔固定时间被调用一次
            oEntity.timer = setInterval(function () {
                oEntity.style.top = oEntity.offsetTop - 20 + "px";
                //判断烟花是否上升到或者第一次超过上次鼠标点击位置
                if (oEntity.offsetTop <= param.y) {
                    //烟花爆炸
                    clearInterval(oEntity.timer);
                    document.body.removeChild(oEntity);
                    (function () {
                        //在50-100之间随机生成碎片
                        //由于IE浏览器处理效率低, 随机范围缩小至20-30
                        //自动放烟花时, 随机范围缩小至20-30
                        var len = (/msie/i.test(navigator.userAgent) || that.type == 2) ? fgm.randomRange(20, 30) : fgm.randomRange(50, 100)
                        //产生所有烟花爆炸颗粒实体
                        for (i = 0; i < len; i++) {
                            //烟花颗粒形态实体
                            oChip = document.createElement("div");
                            with (oChip.style) {
                                position = "absolute";
                                top = param.y + "px";
                                left = param.x + "px";
                                width = "4px";
                                height = "4px";
                                overflow = "hidden";
                                borderRadius = "4px";
                                background = fgm.getRanColor();
                            };
                            oChip.speedX = fgm.randomRange(-20, 20);
                            oChip.speedY = fgm.randomRange(-20, 20);
                            oFrag.appendChild(oChip);
                            aChip[i] = oChip
                        };
                        document.body.appendChild(oFrag);
                        timer = setInterval(function () {
                            for (i = 0; i < aChip.length; i++) {
                                var obj = aChip[i];
                                with (obj.style) {
                                    top = obj.offsetTop + obj.speedY + "px";
                                    left = obj.offsetLeft + obj.speedX + "px";
                                };
                                obj.speedY++;
                                //判断烟花爆炸颗粒是否掉落至窗体之外，为真则remove
                                //splice() 方法可删除从 index 处开始的零个或多个元素
                                (obj.offsetTop < 0 || obj.offsetLeft < 0 || obj.offsetTop > document.documentElement.clientHeight || obj.offsetLeft > document.documentElement.clientWidth) && (document.body.removeChild(obj), aChip.splice(i, 1))
                            };
                            //判断烟花爆炸颗粒是否全部remove，为真则clearInterval(timer);
                            !aChip[0] && clearInterval(timer);
                        }, 30)
                    })()
                }
            }, 30)
        }
    };

    var fw = new FireWorks();
    fw.type = 2;
    fw.initialize();
}



//播放音乐，并可视化
function playMusic() {

    var canvas = document.querySelector("#canvas"),
        context = canvas.getContext('2d');
    var width = canvas.width,
        height = canvas.height;
    var audio = document.querySelector("#mp3");

    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }

    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
    try {
        var audioContext = new window.AudioContext();
    } catch (e) {
        throw new Error("您的浏览器不支持！");
    }
    audioContext.resume();
    var analyser = audioContext.createAnalyser(),
        source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);//截取音频信号
    analyser.connect(audioContext.destination);//声音连接到扬声器

    function getSource() {
        if (audio.paused) {
            return false;
        }
        var data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);//得到音频能量值
        var playerTimeDomainData = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(playerTimeDomainData);//得到频谱
        var volumn = Math.max.apply(null, playerTimeDomainData) - Math.min.apply(null, playerTimeDomainData);
        context.clearRect(0, 0, width, height);
        drawColumn(data);
    }

    function drawColumn(data) {
        var gradient, lineHeight, capArr = [],
            start = 10,//从X轴何处坐标开始画
            lineWidth = 2,//柱体宽度
            lineGap = 3,//柱体间距
            dataGap = 10;//每隔多少取一个数据用于绘画，意抽取片段数据来反映整体频谱规律
        var count = parseInt((width - start * 2) / (lineWidth + lineGap));
        var thisCap, drawX;

        for (var i = 0; i < count; i++) {
            thisCap = data[start + i * dataGap];
            lineHeight = parseInt(height - (thisCap * 0.4));
            /*保存帽头数组*/
            if (capArr[i]) {
                if (capArr[i] > lineHeight) {
                    capArr[i] = lineHeight;
                }
            } else {
                capArr[i] = lineHeight;
            }
            context.lineWidth = lineWidth;
            drawX = start + (lineWidth + lineGap) * i;
            gradient = context.createLinearGradient(drawX, height, drawX, lineHeight);
            gradient.addColorStop(1, '#e3b4b8');
            gradient.addColorStop(0.5, '#f0a1a8');
            gradient.addColorStop(0, '#ee9ca7');
            /*画频谱柱条*/
            context.beginPath();
            context.strokeStyle = gradient;
            context.moveTo(drawX, height);
            context.lineTo(drawX, lineHeight);

            context.stroke();
            context.closePath();
            /*绘制帽头*/
            context.beginPath();
            context.lineWidth = 1;
            context.fillStyle = "#e3b4b8";
            context.arc(drawX, capArr[i] - 3, lineWidth / 2, 0, Math.PI * 2, true);
            context.fill();
            context.closePath();
            capArr[i] += 0.5
        }

    }

    var mtimer;
    mtimer = setInterval(getSource, 10);
}

//文字效果
function playVideo() {
    var video = document.querySelector("#mp4");
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }    
}




function init() {
    playMusic();
    playFire();
    playVideo()
}
