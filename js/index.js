/**
 * 2017/7/18
 */


function Music() {
     this.songInfo = {
         channel:""
     };
    this.myAudio = myAudio = document.getElementsByTagName("audio")[0];
    this._init();
}
Music.prototype = {
    _init: function () {
        this._bind();
        this._getSong();
        this._getChannels();
        this._choseChannels();
        this._renderLike();
    },
    _bind: function () {
        var that = this;
        setInterval(function () {
            that._present()
        }, 500);
        
        var x=0;
        var volumelist=["icon-volume-0","icon-volume-1","icon-volume-2","icon-volume-3"]
        $(".volume").on('click', function(e){
            if(x<4){
                this.classList.remove("icon-volume-3");
                if(x>0){this.classList.remove(volumelist[x-1]);}
                this.classList.add(volumelist[x]);
                x++;
            }else{
                 x=0;
                 this.classList.remove(volumelist[3]);
                 this.classList.add(volumelist[x]);
            }
            if($(".volume").hasClass("icon-volume-0")){
                myAudio.muted=true;
            }else{
                myAudio.muted=false;
            }
            if($(".volume").hasClass("icon-volume-0")){
                $(".volume-bar span").removeClass("active")
            }
            if($(".volume").hasClass("icon-volume-1")){
                myAudio.volume = 1/5;
                $(".volume-bar span").removeClass("active")
                $(".volume-bar span").eq(2).addClass("active")
            }
            if($(".volume").hasClass("icon-volume-2")){
                myAudio.volume = 3/5;
                $(".volume-bar span").removeClass("active")
                $(".volume-bar span").eq(1).addClass("active")
            }
            if($(".volume").hasClass("icon-volume-3")){
                myAudio.volume = 1;
                $(".volume-bar span").removeClass("active")
                $(".volume-bar span").first().addClass("active")
            }
        });

        $(".buttons .icon-heart").on("click", function () {                          //控制红心,
            if($(this).hasClass("active")) {
                $(this).removeClass("active");
            }else{
                $(this).addClass("active");
            }
        });


        $(".buttons .play").on("click", function () {              //控制暂停/播放开关
            that._playPause();
        });
        $(".buttons .icon-next").on("click", function () {              //控制下一曲开关
            that._getSong();
        });
        $(".progress-bar").on("click", function (event) {      //调整进度
            var distance = event.clientX - $(this).offset().left;
            var percentage = distance / $(this).width();
            myAudio.currentTime = myAudio.duration * percentage;
        });
    },

    _getSong: function () {                                    //向API发请求，获取歌曲
        var that = this;
        $.ajax({
            url: "https://api.jirengu.com/fm/getSong.php",
            method: "get",
            dataType: "json",
            data: {channel: that.songInfo.channel}
        }).done(function (event) {                           //存储歌曲信息
            var ret = event.song[0];
            that.songInfo.sid = ret.sid;
            that.songInfo.title = ret.title;
            that.songInfo.picture = ret.picture;
            that.songInfo.artist = ret.artist;
            that.songInfo.url = ret.url;
            $("footer ul").empty();               //清空上一首的歌词
            $(".buttons .icon-heart").removeClass("active");
            that._getLyric();
            that._loadSong();
        }).fail(function () {
            that._getSong();
        });
    },

    _getChannels: function () {                            //获取频道列表
        var that = this;
        $.ajax({
            url: "https://api.jirengu.com/fm/getChannels.php",
            method: "get",
            dataType: "json"
        }).done(function (event) {
            var ret = event.channels;
            ret.forEach(function (e) {
                that._renderChannels(e);
            })
            var $imgCt=$(".channels"),
                $preBtn=$(".icon-arrow-left"),
                $nextBtn=$(".icon-arrow-right");
            var $firstImg=$imgCt.find("li").first(),
                $secondImg=$imgCt.find("li").eq(1),
                $lastImg=$imgCt.find("li").last();
            var curPageIndex=0;
            var imgLength=$imgCt.children().length;
            var isAnimate=false;
            $imgCt.prepend($lastImg.clone())
            $imgCt.append($firstImg.clone())
            $imgCt.append($secondImg.clone())
            $imgCt.width($firstImg.width() * $imgCt.children().length)
            $imgCt.css("left","-84px")
            $preBtn.on("click",function(e){
                e.preventDefault();
                playPre(1);
            })
            $nextBtn.on("click",function(e){
                e.preventDefault();
                playNext(1);
            })
            function playNext(len){
                if(isAnimate) return;
                isAnimate=true;
                $imgCt.animate({
                    left:"-="+(84*len)+'px'
                },function(){
                    curPageIndex=curPageIndex+len;
                    if(curPageIndex>imgLength-1){
                        $imgCt.css({"left":"-84px"})
                        curPageIndex=0;
                    }
                    isAnimate=false;
                })
            }
            function playPre(len){
                if(isAnimate) return;
                isAnimate=true;
                $imgCt.animate({
                    left:"+="+(84*len)+'px'
                },function(){
                    curPageIndex=curPageIndex-len;
                    if(curPageIndex<0){
                        $imgCt.css("left",-(imgLength * $firstImg.width()));
                        curPageIndex=imgLength-1;
                    }
                    isAnimate=false;
                })
            }
        }).fail(function () {
            $(".channels").append("<li>请检查网络连接</li>");
        })
    },

    _getLyric: function () {          //获取歌词
        var that = this;
        $.ajax({
            url: "https://api.jirengu.com/fm/getLyric.php",
            method: "get",
            dataType: "json",
            data: {sid: that.songInfo.sid}
        }).done(function (event) {
            that._renderLyric(event.lyric);                    //渲染
        }).fail(function () {
            $("footer ul").append("<li>抱歉！此歌没有歌词</li>")
        });
    },


    _renderChannels: function (e) {                           //渲染频道列表
        var channelsItem = "<li channel_id = '" + e.channel_id + "'>" + e.name + "</li>";
        $(".channels").append(channelsItem);
    },


    _choseChannels: function () {
        var that = this;
        $(".chan-list .channels").on("click", function (e) {
            var target = e.target
            if (e.target.tagName.toLowerCase() != "li" || !e.target.hasAttributes("channel_id")) return;
            that.songInfo.channel = e.target.getAttribute("channel_id");
            that._getSong();
            $.each($(".channels li"),function(i,li){
                        li.classList.remove('active');
                    })
            target.classList.add('active');
        })
    },

    _renderLyric: function (e) {
        var that = this;
        var lyric = this._parseLyric(e);
        var item = "";
        lyric.forEach(function (i) {
            item += '<li dataTime ="' + i[0] + '">' + i[1] + '</li>';
        });
        $("footer ul").append(item);
        this.myAudio.addEventListener("timeupdate", function () {            //每行高度
            for (var i = 0; i < lyric.length; i++) {                          //遍历歌词下所有的li
                var curT = $("footer li").eq(i).attr("dataTime");      //获取当前li存入的当前一排歌词时间
                var nexT = $("footer li").eq(i + 1).attr("dataTime");
                var curTime = that.myAudio.currentTime;      
                var minutes = parseInt(curTime/60) 
                var sseconds = parseInt(curTime%60)+''
                sseconds = sseconds.length == 2? sseconds : '0'+sseconds
                $(".time").text(minutes + ':' + sseconds)
                if ((curTime > curT) && (curT < nexT)) {                //当前时间在下一句时间和歌曲当前时间之间的时候 就渲染 并滚动
                    $("footer li").removeClass("active");
                    $("footer li").eq(i).addClass("active");
                }
            }
        })
    },

    _parseLyric: function (e) {                     //解析歌词,返回一个二维数组
        var lines = e.split("\n"),
            pattern = /^\[\d{2}\:\d{2}\.\d{2}\]/;
        var lyricArr = [];
        lines.forEach(function (i) {
            if (!pattern.test(i)) {              //剔除收到数据中没有时间的部分
                lines.splice(i, 1);
                return;
            }
            var time = i.match(pattern);       //把歌词分为：时间和歌词两个部分
            var lyric = i.split(time);
            var seconds = time[0][1] * 600 + time[0][2] * 60 + time[0][4] * 10 + time[0][5] * 1;  //将时间换算为秒
            lyricArr.push([seconds, lyric[1]]);      //将整个歌词保存至二维数组中，形式为[时间，歌词]；
        });
        return lyricArr;
    },

    _loadSong: function () {                         //将动态获取的地址，图片添加至正确的位置，以及加载新歌时的一切杂项
        $("audio").attr("src", this.songInfo.url);
        $("img").attr("src", this.songInfo.picture);
        $(".detail .title").html(this.songInfo.title);
        $(".detail .singer").html(this.songInfo.artist);
    },
    _renderLike: function(){
        for(var i=0;i < localStorage.length;i++){
            $(".my-like").append("<li title='" + localStorage.key(i)+  "'>" + localStorage.key(i) + "</li>");
        }
    },

    _playPause: function () {      //切换播放、暂停
        if (this.myAudio.paused) {
            this.myAudio.play();
            $(".play").addClass("icon-stop");
            $(".play").removeClass("icon-play");
        } else {
            this.myAudio.pause();
            $(".play").addClass("icon-play");
            $(".play").removeClass("icon-stop");
        }
    },

    _present: function () {                //控制进度条
        var length = this.myAudio.currentTime / this.myAudio.duration * 100;
        $(".progress").width(length + '%');
        if (length == 100) {              //自动切歌
            this._getSong();
        }
    },

    _localFetch: function (key) {
        return JSON.parse(window.localStorage.getItem(key))
    },
};

new Music();
