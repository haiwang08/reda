/**
 * Welcome to Red Panda shadowing!
 * au: 丹戌君
 */
class PandaShadowing {
    //

    constructor(vSelector, subtitles, offset, env) {
        this.v = vSelector ? $(vSelector)[0] : $(video)[0];
        this.defaultRepeatSt = -1;
        this.defaultRepeatEt = 0;
        this.repeatSt = this.defaultRepeatSt;
        this.repeatEt = this.defaultRepeatEt;
        this.isRepeating = false;
        this.currentIdx = -1;
        this.subtitleBox = null;
        this.subtitleHead = null;
        this.subtitleContainer = null;
        this.isSeeking = false;
        this.subtitles = subtitles;
        this.offset = offset ? offset : 0;
        this.env = env;
        this.pinned = false;

        // 拖动字幕容器
        this.isDragging = false;
        this.offsetX, this.offsetY;

        this.initComponents();

        // 绑定快捷键
        $(document).on("keyup", (e) => {
            this.ss(this.currentIdx);
            if (e.key === "f" || e.key === "ArrowLeft") {
                this.repeatSentenceSwitch(this.currentIdx);
            } else if (e.key === "ArrowRight") {
                this.playAt(this.subtitles[this.currentIdx].st);
            } else if (e.key === "ArrowDown") {
                if (this.isRepeating) {
                    this.repeatSentenceSwitch(this.currentIdx + 1);
                } else {
                    this.playAt(this.subtitles[this.currentIdx + 1].st);
                }
            } else if (e.key === "ArrowUp") {
                if (this.isRepeating) {
                    this.repeatSentenceSwitch(this.currentIdx - 1);
                } else {
                    this.playAt(this.subtitles[this.currentIdx - 1].st);
                }
            } else if (e.key === " " || e.keyCode === 32) {
                if (this.v.paused) {
                    this.v.play();
                } else {
                    this.v.pause();
                }
            }
        });
        $(document).on("keydown", function (e) {
            if (e.key === " " || e.keyCode === 32) {
                // 空格键
                e.preventDefault(); // 阻止默认滚动
            }
        });
    }

    ss(ss) {
        console.log(ss);
    }

    initComponents() {
        // 插入底座
        if ($("#subtitleBox").length > 0) {
            $("#subtitleBox").html("");
        } else {
            // init
            const subtitleContainer =
                "<div id='subtitleBox'><div id='subtitleContainer' class='subtitle-container'></div></div>";
            $("body").append(subtitleContainer);
        }

        this.subtitleBox = $("#subtitleBox");
        this.subtitleHead = $("#subtitleHead");
        this.subtitleContainer = $("#subtitleContainer");

        // 拖动视频事件
        this.v.addEventListener("seeking", () => {
            this.isSeeking = true;
        });

        this.v.addEventListener("seeked", () => {
            this.isSeeking = false;
            this.updateSubtitles(1111111111); // 更新字幕到拖动后的位置
        });

        // 视频事件监听
        this.v.addEventListener("timeupdate", (e) => {
            if (this.isRepeating) {
                if (e.target.currentTime >= this.repeatEt) {
                    this.playAt(this.repeatSt);
                }
            }
            if (!this.isSeeking) {
                this.updateSubtitles(222222222222);
            }
        });

        // 绑定拖动窗口事件
        this.subtitleHead.mousedown((e) => {
            this.isDragging = true;
            this.offsetX = e.clientX - this.subtitleBox.offset().left;
            this.offsetY = e.clientY - this.subtitleBox.offset().top;
            $(document).mousemove((e) => {
                this.onMouseMove(e);
            });
            $(document).mouseup(() => {
                this.isDragging = false;
                $(document).off("mousemove", this.onMouseMove);
            });
        });
    }

    onMouseMove(e) {
        if (this.isDragging) {
            this.subtitleBox.css({
                left: e.pageX - this.offsetX + "px",
                top: e.pageY - this.offsetY + "px",
            });
        }
    }

    createAdButton(time, tag, index, onClickHandler) {
        return $("<button>")
            .text(time)
            .addClass("adButton")
            .click(() => {
                const currentScrollPosition =
                    this.subtitleContainer.scrollTop();
                if (tag == 1) {
                    this.subtitles[index].st += time;
                    this.playAt(this.subtitles[index].st);
                } else {
                    this.subtitles[index].et += time;
                    this.playAt(this.subtitles[index].et);
                }
            });
    }

    // 创建字幕行元素
    render() {
        this.subtitleContainer.empty();
        this.subtitles.forEach((subtitle, index) => {
            const subtitleDiv = $("<div>")
                .addClass("subtitle")
                .text(subtitle.text)
                .attr("data-st", subtitle.st)
                .click(() => {
                    this.playAt(subtitle.st);
                });
            const repeatButton = $("<div>")
                .text("●")
                .addClass("repeatButton")
                .click((e) => {
                    this.repeatSentenceSwitch(index);
                });
            let subLine = $("<div>").addClass("subLine");

            let adButtons1 = [];
            let adButtons2 = [];
            if (this.env == "dev") {
                adButtons1 = [
                    this.createAdButton(-0.2, 1, index),
                    this.createAdButton(-0.1, 1, index),
                    this.createAdButton(0.2, 1, index),
                    this.createAdButton(0.1, 1, index),
                ];
                adButtons2 = [
                    this.createAdButton(-0.2, 2, index),
                    this.createAdButton(-0.1, 2, index),
                    this.createAdButton(0.1, 2, index),
                    this.createAdButton(0.2, 2, index),
                ];
            }
            adButtons1.forEach((button) => subLine.append(button));
            subLine.append(repeatButton);
            subLine.append(subtitleDiv);
            adButtons2.forEach((button) => subLine.append(button));
            this.subtitleContainer.append(subLine);
        });
    }

    scrollToSubtitle(index) {
        this.subtitleContainer.scrollTop(40 * index - 120);
    }

    updateSubtitles(n) {
        if (!this.pinned) {
            const currentTime = this.v.currentTime;
            const newIndex = this.subtitles.findIndex(
                (sub, idx) =>
                    currentTime >= sub.st &&
                    currentTime <= sub.et &&
                    (idx === this.subtitles.length - 1 ||
                        currentTime <= this.subtitles[idx + 1].st)
            );

            if (newIndex !== -1 && newIndex !== this.currentIdx) {
                this.currentIdx = newIndex;
                const subtitleElements = this.subtitleContainer.children();

                // 滚动至当前字幕，增亮当前播放字幕
                subtitleElements.each((idx, el) => {
                    $(el)
                        .toggleClass("highlight", idx === this.currentIdx)
                        .css("opacity", idx === this.currentIdx ? "1" : "0.5");
                });

                // 将当前字幕居中
                this.scrollToSubtitle(this.currentIdx);
            }
        }
    }

    setTime() {}

    playAt(time) {
        this.v.currentTime = time + this.offset;
        this.v.play();
    }

    repeatSentenceSwitch(idx) {
        if (this.isRepeating && idx != this.currentIdx) {
            this.isRepeating = false;
            this.repeatSentenceSwitch(idx);
        } else if (!this.isRepeating) {
            $(".repeatButton").text("●");
            this.repeatSt = this.subtitles[idx].st;
            this.repeatEt = this.subtitles[idx].et;
            this.isRepeating = true;
            const subtitleElements = this.subtitleContainer.children();
            //subtitleElements[idx].children
            subtitleElements[idx].children[4].textContent = "⭕";
            this.playAt(this.subtitles[idx].st);
        } else {
            $(".repeatButton").text("●");
            this.isRepeating = false;
            this.repeatSt = this.defaultRepeatSt;
            this.repeatEt = this.defaultRepeatEt;
        }
        if (!idx) {
            idx = this.currentIdx;
        }
    }

    repeat() {
        this.repeatSentenceSwitch(this.currentIdx);
    }

    msg(code, msg) {
        return { code: code, msg: msg };
    }

    pin() {
        this.pinned = !this.pinned;
        return this.pinned
            ? this.msg("0000", "锁定成功")
            : this.msg("0001", "解锁成功");
    }
}
