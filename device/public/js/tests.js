$(document).ready(function() {
  $(".color-picker")
    .colorpicker()
    .on("changeColor", function(ev) {
      document.body.style.backgroundColor = ev.color.toHex();
      const rgba = ev.color.toRGB();
      $.get(
        "/command/color/" + rgba.r + "/" + rgba.g + "/" + rgba.b + "/" + rgba.a,
        function(data) {}
      );
    });

  $(".device-on").click(function() {
    $.get("/command/on", function(data) {});
  });

  $(".device-off").click(function() {
    $.get("/command/off", function(data) {});
  });
});
