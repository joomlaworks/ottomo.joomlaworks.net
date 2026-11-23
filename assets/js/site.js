/* Ottomo site */

(function () {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The phone menu
    var nav = document.getElementById("nav"), menuBtn = document.getElementById("menuBtn");
    menuBtn.addEventListener("click", function () { menuBtn.setAttribute("aria-expanded", nav.classList.toggle("open")) });
    nav.querySelectorAll(".nav-links a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false") }) });

    // The logo links: back to the very top like a link home, without "#top" in the address bar
    document.querySelectorAll('a[href="#top"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
            if (location.hash && history.replaceState) history.replaceState(null, "", location.pathname + location.search);
        });
    });

    // The mail room plays once when it comes into view: the robot posts each email into the inbox,
    // the send bar fills, then opens and clicks come in (without JavaScript or with reduced motion: the finished state)
    var room = document.querySelector(".mailroom");
    if (room && !reduce && "IntersectionObserver" in window) {
        var mails = room.querySelectorAll(".mail"), tags = room.querySelectorAll(".tag"), robot = room.querySelector(".robot svg"),
            flyer = room.querySelector(".flyer"), list = room.querySelector(".mails"), count = room.querySelector(".sendbar-count b"),
            bar = room.querySelector(".sendbar-track i"), total = mails.length;
        room.classList.add("play");
        count.textContent = "0";
        bar.style.width = "0%";
        var fly = function (i, done) {
            var box = room.getBoundingClientRect(), from = robot.getBoundingClientRect(), to = mails[i].getBoundingClientRect();
            var x0 = from.left - box.left + from.width / 2 - 22, y0 = from.top - box.top + from.height * .55 - 22;
            var x1 = to.left - box.left + 2, y1 = to.top - box.top + to.height / 2 - 22;
            if (!flyer.animate) { done(); return; }
            var a = flyer.animate([
                { transform: "translate(" + x0 + "px," + y0 + "px) scale(.5) rotate(-12deg)", opacity: 0 },
                { transform: "translate(" + (x0 + 40) + "px," + (y0 - 24) + "px) scale(1) rotate(-6deg)", opacity: 1, offset: .3 },
                { transform: "translate(" + x1 + "px," + y1 + "px) scale(.8) rotate(0)", opacity: 1, offset: .9 },
                { transform: "translate(" + x1 + "px," + y1 + "px) scale(.6)", opacity: 0 }
            ], { duration: 820, easing: "cubic-bezier(.3,.6,.2,1)" });
            a.onfinish = done;
        };
        var run = function () {
            room.classList.add("sending");
            var i = 0;
            (function next() {
                if (i >= total) {
                    room.classList.remove("sending");
                    var k = 0;
                    (function reveal() {
                        if (k >= tags.length) { room.classList.add("done"); return; }
                        tags[k++].classList.add("in");
                        setTimeout(reveal, 420);
                    }());
                    return;
                }
                fly(i, function () {
                    mails[i].classList.add("in");
                    i++;
                    count.textContent = String(i);
                    bar.style.width = (100 * i / total) + "%";
                    setTimeout(next, 160);
                });
            }());
        };
        var seen = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) { seen.disconnect(); setTimeout(run, 400); }
        }, { threshold: .45 });
        seen.observe(list);
    }

    // Carousels: one screenshot at a time, moved with the arrows, the dots, a swipe or the arrow keys (without JavaScript, a row to scroll).
    // A click opens the screenshot in SuperModal, with the carousel's other screenshots as its gallery.
    document.querySelectorAll("[data-carousel]").forEach(function (box) {
        var track = box.querySelector(".car-track"), slides = Array.prototype.slice.call(track.children), n = slides.length, cur = 0;
        if (n < 2) return;
        var bar = document.createElement("div"), dots = document.createElement("div");
        bar.className = "car-nav"; dots.className = "car-dots";
        function button(cls, label, text) {
            var b = document.createElement("button");
            b.type = "button"; b.className = cls; b.setAttribute("aria-label", label); b.textContent = text;
            return b;
        }
        var prev = button("car-btn", "Previous screenshot", "←"), next = button("car-btn", "Next screenshot", "→");
        var dotList = slides.map(function (s, i) {
            var d = button("car-dot", "Screenshot " + (i + 1) + " of " + n, "");
            d.addEventListener("click", function () { go(i) });
            dots.appendChild(d);
            return d;
        });
        bar.appendChild(prev); bar.appendChild(dots); bar.appendChild(next);
        box.appendChild(bar);
        box.querySelector(".car-viewport").setAttribute("aria-live", "polite");
        function go(i) {
            cur = (i + n) % n;
            track.style.transform = "translateX(" + (-100 * cur) + "%)";
            slides.forEach(function (s, k) {
                s.setAttribute("aria-hidden", k === cur ? "false" : "true");
                var a = s.querySelector("a");
                if (a) a.tabIndex = k === cur ? 0 : -1;
            });
            dotList.forEach(function (d, k) { d.setAttribute("aria-current", k === cur ? "true" : "false") });
        }
        prev.addEventListener("click", function () { go(cur - 1) });
        next.addEventListener("click", function () { go(cur + 1) });
        box.addEventListener("keydown", function (e) {
            if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1) }
            else if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1) }
        });
        // A swipe follows the finger; a click that ended a swipe doesn't open the screenshot
        var startX = null, dx = 0, moved = false;
        track.addEventListener("pointerdown", function (e) {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            startX = e.clientX; dx = 0; moved = false;
        });
        track.addEventListener("pointermove", function (e) {
            if (startX === null) return;
            dx = e.clientX - startX;
            if (!moved && Math.abs(dx) > 8) { moved = true; track.classList.add("is-dragging"); track.setPointerCapture(e.pointerId) }
            if (moved) track.style.transform = "translateX(calc(" + (-100 * cur) + "% + " + dx + "px))";
        });
        function end() {
            if (startX === null) return;
            startX = null; track.classList.remove("is-dragging");
            if (moved && Math.abs(dx) > track.offsetWidth / 6) go(dx < 0 ? cur + 1 : cur - 1); else go(cur);
        }
        track.addEventListener("pointerup", end);
        track.addEventListener("pointercancel", end);
        track.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false } }, true);
        track.addEventListener("dragstart", function (e) { e.preventDefault() });
        box.classList.add("is-ready");
        go(0);
        // Closing SuperModal on another screenshot of this carousel brings the carousel there too
        document.addEventListener("supermodal:change", function (e) {
            var item = e.detail && e.detail.item, src = item && (item.src || item.href);
            if (!src) return;
            slides.forEach(function (s, k) {
                var a = s.querySelector("a");
                if (a && a.href === new URL(src, location.href).href && k !== cur) go(k);
            });
        });
    });
}());
