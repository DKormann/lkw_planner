// src/view/html.ts
var body = document.body;
var colorPalette = {
  light: {
    color: "#000",
    background: "#fff",
    red: "rgb(242, 55, 55)",
    green: "rgb(57, 214, 39)",
    blue: "rgb(5, 28, 141)",
    lightblue: "rgb(21, 137, 239)",
    gray: "#888",
    lightgray: "#e5e5e5"
  },
  dark: {
    color: "#fff",
    background: "#222",
    red: "rgb(198, 20, 0)",
    blue: "rgb(95, 159, 255)",
    lightblue: "rgb(95, 100, 255)",
    green: "rgb(0, 185, 19)",
    gray: "#565656",
    lightgray: "#414141"
  }
};
var color = {
  color: "var(--color)",
  background: "var(--background)",
  blue: "var(--blue)",
  lightBlue: "var(--lightblue)",
  red: "var(--red)",
  green: "var(--green)",
  gray: "var(--gray)",
  lightgray: "var(--lightgray)"
};
var styl = document.createElement("style");
styl.innerHTML = `
:root {
  --color: ${colorPalette.dark.color};
  --background: ${colorPalette.dark.background};
  --red: ${colorPalette.dark.red};
  --green: ${colorPalette.dark.green};
  --blue: ${colorPalette.dark.blue};
  --gray: ${colorPalette.dark.gray};
  --lightgray: ${colorPalette.dark.lightgray};
  color: var(--color);
  background: var(--background);
  font-family: sans-serif;
}
@media (prefers-color-scheme: light) {
  :root {
    --color: ${colorPalette.light.color};
    --background: ${colorPalette.light.background};
    --red: ${colorPalette.light.red};
    --green: ${colorPalette.light.green};
    --blue: ${colorPalette.light.blue};
    --gray: ${colorPalette.light.gray};
    --lightgray: ${colorPalette.light.lightgray};
  }
}
`;
document.head.appendChild(styl);
var htmlElement = (tag, text, args) => {
  const _element = document.createElement(tag);
  _element.textContent = text;
  let st = _element.style;
  if (tag == "button") {
    _element.innerText = text;
    st.color = color.color;
    st.backgroundColor = color.lightgray;
    st.border = "1px solid " + color.gray;
    st.borderRadius = ".2em";
    st.padding = ".1em .4em";
    st.margin = ".2em";
  }
  if (args)
    Object.entries(args).forEach(([key, value]) => {
      if (key === "parent") {
        value.appendChild(_element);
      }
      if (key === "children") {
        value.forEach((c) => _element.appendChild(c));
      } else if (key === "eventListeners") {
        Object.entries(value).forEach(([event, listener]) => {
          _element.addEventListener(event, listener);
        });
      } else if (key === "style") {
        Object.assign(_element.style, value);
      } else {
        _element[key] = value;
      }
    });
  return _element;
};
var html = (tag, ...cs) => {
  let children = [];
  let args = {};
  const add_arg = (arg) => {
    if (typeof arg === "string")
      children.push(htmlElement("span", arg));
    else if (typeof arg === "number")
      children.push(htmlElement("span", arg.toString()));
    else if (arg instanceof Promise) {
      const el = span("...");
      arg.then((value) => {
        el.innerHTML = "";
        el.appendChild(span(value));
      });
      children.push(el);
    } else if (arg instanceof HTMLElement)
      children.push(arg);
    else if (Array.isArray(arg))
      arg.forEach((x) => add_arg(x));
    else if (typeof arg == "function") {
      if (arg.name == "oninput")
        args.oninput = arg;
      else if (arg.name == "onclick" || arg.length < 2)
        args.onclick = arg;
      else
        console.warn("Function argument without name or with more than one parameter is ignored in html generator");
    } else
      args = { ...args, ...arg };
  };
  cs.forEach(add_arg);
  return htmlElement(tag, "", { ...args, children });
};
var newHtmlGenerator = (tag) => (...cs) => html(tag, ...cs);
var p = newHtmlGenerator("p");
var a = newHtmlGenerator("a");
var h1 = newHtmlGenerator("h1");
var h2 = newHtmlGenerator("h2");
var h3 = newHtmlGenerator("h3");
var h4 = newHtmlGenerator("h4");
var div = newHtmlGenerator("div");
var pre = newHtmlGenerator("pre");
var span = newHtmlGenerator("span");
var textarea = newHtmlGenerator("textarea");
var button = newHtmlGenerator("button");
var table = newHtmlGenerator("table");
var tr = newHtmlGenerator("tr");
var td = newHtmlGenerator("td");
var th = newHtmlGenerator("th");
var canvas = newHtmlGenerator("canvas");
var style = (...rules) => ({ style: Object.assign({}, ...rules) });
var select = (...cs) => {
  const el = html("select", ...cs);
  cs.filter((c) => typeof c == "string").forEach((c) => el.options.add(new Option(c, c)));
  return el;
};
var popup = (...cs) => {
  const dialogfield = div({
    style: {
      background: color.background,
      color: color.color,
      padding: "1em 4em",
      paddingBottom: "2em",
      borderRadius: "1em",
      zIndex: "2000",
      overflowY: "scroll",
      minWidth: "20vw",
      maxHeight: "80vh"
    }
  }, ...cs);
  const popupbackground = div({ style: {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    background: "rgba(166, 166, 166, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "2000"
  } });
  popupbackground.appendChild(dialogfield);
  document.body.appendChild(popupbackground);
  popupbackground.onclick = () => {
    popupbackground.remove();
  };
  dialogfield.onclick = (e) => e.stopPropagation();
  return popupbackground;
};

// src/view/germany_outline.json
var germany_outline_default = [[[[13.8157, 48.7664], [13.7836, 48.7153], [13.8169, 48.6956], [13.8024, 48.6117], [13.7165, 48.5217], [13.4546, 48.5734], [13.4056, 48.3766], [12.8626, 48.1966], [12.7389, 48.1134], [12.9912, 47.8471], [12.892, 47.7235], [13.0199, 47.7129], [13.072, 47.6595], [13.0019, 47.466], [12.7789, 47.5548], [12.8132, 47.6118], [12.762, 47.6669], [12.4966, 47.6289], [12.4241, 47.6916], [12.2387, 47.6789], [12.2422, 47.732], [12.1766, 47.7058], [12.2068, 47.6456], [12.1736, 47.6051], [11.6205, 47.5897], [11.5512, 47.5137], [11.4126, 47.5061], [11.3655, 47.4693], [11.3839, 47.4449], [11.237, 47.394], [11.1938, 47.4289], [10.9795, 47.3905], [10.8584, 47.4852], [10.8922, 47.5149], [10.8586, 47.5307], [10.7608, 47.5136], [10.5837, 47.5625], [10.4825, 47.5329], [10.4292, 47.577], [10.4283, 47.396], [10.3059, 47.3022], [10.1599, 47.2711], [10.2093, 47.3725], [10.0829, 47.3591], [10.0718, 47.4391], [9.9459, 47.5408], [9.8335, 47.5346], [9.7821, 47.5884], [9.6126, 47.5219], [9.1834, 47.6704], [8.8817, 47.6561], [8.7976, 47.72], [8.7171, 47.6946], [8.7131, 47.7574], [8.6441, 47.791], [8.6174, 47.7573], [8.5582, 47.8012], [8.4636, 47.7639], [8.3913, 47.6655], [8.6073, 47.6563], [8.5741, 47.5924], [8.5224, 47.6219], [8.3541, 47.581], [8.233, 47.622], [8.0423, 47.5606], [7.8197, 47.5953], [7.7667, 47.556], [7.6097, 47.5647], [7.6597, 47.5966], [7.586, 47.5846], [7.5119, 47.7073], [7.6211, 47.9714], [7.5789, 48.1145], [7.7507, 48.3414], [7.7383, 48.4066], [7.8135, 48.5195], [7.8103, 48.615], [7.9701, 48.7573], [8.0903, 48.8075], [8.2003, 48.9586], [7.9319, 49.0348], [7.635, 49.0378], [7.4105, 49.1689], [7.2744, 49.105], [7.0799, 49.142], [7.0425, 49.1076], [7.0095, 49.1817], [6.9144, 49.2067], [6.8335, 49.2095], [6.8218, 49.1478], [6.7256, 49.1556], [6.5564, 49.3264], [6.5777, 49.3558], [6.5117, 49.4247], [6.3453, 49.4553], [6.3508, 49.5666], [6.4027, 49.6558], [6.4997, 49.7122], [6.5026, 49.7957], [6.3026, 49.8349], [6.1619, 49.9425], [6.0964, 50.0486], [6.1213, 50.1616], [6.1651, 50.1819], [6.1468, 50.214], [6.286, 50.3039], [6.3745, 50.3155], [6.3369, 50.481], [6.1708, 50.518], [6.2491, 50.6144], [6.1594, 50.6224], [6.081, 50.7135], [6.0115, 50.7085], [5.973, 50.7818], [6.0567, 50.8527], [6.0637, 50.9075], [5.9999, 50.9294], [6.0037, 50.9737], [5.8746, 50.9654], [5.8582, 51.0193], [6.1473, 51.1523], [6.1571, 51.1793], [6.0608, 51.1709], [6.0566, 51.2117], [6.2078, 51.3877], [6.1933, 51.5093], [6.0865, 51.5955], [6.0992, 51.6445], [5.9393, 51.7319], [5.9641, 51.7766], [5.9315, 51.8156], [6.1561, 51.8421], [6.093, 51.8853], [6.127, 51.8967], [6.345, 51.8211], [6.3785, 51.8601], [6.7438, 51.9083], [6.8092, 51.9795], [6.6799, 52.0605], [7.0263, 52.2306], [7.0482, 52.3651], [6.9733, 52.4514], [6.7148, 52.4616], [6.6717, 52.5417], [6.7438, 52.5597], [6.704, 52.5831], [6.737, 52.6347], [7.0185, 52.626], [7.062, 52.824], [7.1928, 52.998], [7.1946, 53.245], [7.2547, 53.3195], [7.3665, 53.3028], [7.0752, 53.3376], [7.0236, 53.3764], [7.0514, 53.5126], [7.1418, 53.5372], [7.0868, 53.5869], [7.2261, 53.6665], [8.0314, 53.7081], [8.0529, 53.6363], [8.168, 53.5532], [8.0588, 53.502], [8.077, 53.4687], [8.2053, 53.4107], [8.2595, 53.4123], [8.3151, 53.4749], [8.2915, 53.5294], [8.2312, 53.5252], [8.2707, 53.6129], [8.5521, 53.5436], [8.49, 53.4864], [8.5044, 53.3581], [8.4976, 53.4748], [8.5658, 53.5467], [8.4861, 53.7004], [8.5876, 53.8704], [8.6727, 53.8916], [8.8607, 53.831], [9.2107, 53.872], [9.2834, 53.8616], [9.5824, 53.5913], [9.832, 53.5436], [9.5837, 53.6125], [9.5322, 53.7112], [9.4358, 53.7487], [9.3952, 53.831], [8.916, 53.9374], [8.8333, 54.0364], [8.9972, 54.0302], [9.0183, 54.0979], [8.9529, 54.1501], [8.8607, 54.1252], [8.8128, 54.1805], [8.8396, 54.2556], [8.9631, 54.3176], [8.6785, 54.2692], [8.5999, 54.3381], [8.6956, 54.3586], [8.6348, 54.3654], [8.6484, 54.4064], [8.8861, 54.4178], [9.0047, 54.4659], [9.0116, 54.5063], [8.8788, 54.6065], [8.8259, 54.5981], [8.8533, 54.6193], [8.8054, 54.6876], [8.6887, 54.7353], [8.6428, 54.8442], [8.6608, 54.8963], [8.9041, 54.8979], [9.1948, 54.8504], [9.2441, 54.8018], [9.4514, 54.8104], [9.5799, 54.8663], [9.5832, 54.8303], [9.8237, 54.7567], [9.9475, 54.7795], [10.0182, 54.7012], [9.9295, 54.6739], [10.0391, 54.6668], [10.0269, 54.56], [9.8401, 54.4753], [10.1434, 54.4918], [10.2039, 54.461], [10.1418, 54.3244], [10.2244, 54.4138], [10.3184, 54.4433], [10.7313, 54.3102], [10.9353, 54.3795], [11.1355, 54.3859], [11.0666, 54.3586], [11.0945, 54.2835], [11.0666, 54.1839], [10.7526, 54.0501], [10.9021, 53.9614], [11.1751, 54.018], [11.2429, 53.9452], [11.3342, 53.9614], [11.4577, 53.9062], [11.5191, 54.0364], [11.5735, 54.039], [11.6897, 54.1552], [12.0881, 54.1941], [12.115, 54.0979], [12.0951, 54.1457], [12.1428, 54.1805], [12.1089, 54.183], [12.3421, 54.3039], [12.5339, 54.4883], [12.5915, 54.4517], [12.9212, 54.4335], [12.4385, 54.3875], [12.3626, 54.3102], [12.3688, 54.2692], [12.4582, 54.2556], [12.4103, 54.2692], [12.4787, 54.3319], [12.6808, 54.4109], [12.7175, 54.4138], [12.6841, 54.3723], [12.7046, 54.3996], [12.8547, 54.3579], [13.0088, 54.4381], [13.0956, 54.3723], [13.1149, 54.28], [13.2888, 54.2343], [13.3489, 54.1805], [13.3215, 54.1668], [13.4035, 54.1737], [13.383, 54.1531], [13.4836, 54.0913], [13.4793, 54.1252], [13.7119, 54.1737], [13.8081, 54.1047], [13.7461, 54.0364], [13.906, 53.9431], [13.8171, 53.8529], [14.0374, 53.7553], [14.2645, 53.7516], [14.2127, 53.7081], [14.2639, 53.7], [14.3042, 53.5085], [14.4416, 53.2518], [14.3807, 53.1899], [14.3433, 53.0486], [14.1445, 52.9599], [14.165, 52.8957], [14.1239, 52.8507], [14.6448, 52.5769], [14.6091, 52.5178], [14.6323, 52.4967], [14.5398, 52.4219], [14.5454, 52.3822], [14.5842, 52.2912], [14.7124, 52.2359], [14.6864, 52.121], [14.7614, 52.0767], [14.6871, 51.9119], [14.5858, 51.8039], [14.7325, 51.6583], [14.71, 51.5302], [14.9554, 51.4354], [14.961, 51.3353], [15.0221, 51.2368], [14.9553, 51.064], [14.7592, 50.8102], [14.6132, 50.8456], [14.6292, 50.9207], [14.5504, 50.9121], [14.5743, 50.9755], [14.4821, 51.0372], [14.2875, 51.0368], [14.2383, 50.9825], [14.3819, 50.9209], [14.3465, 50.8802], [13.9596, 50.8021], [13.8345, 50.7237], [13.5566, 50.7067], [13.4479, 50.5973], [13.3688, 50.6283], [13.3056, 50.5758], [13.2323, 50.582], [13.1601, 50.497], [13.0096, 50.4927], [12.9526, 50.4042], [12.8174, 50.443], [12.6918, 50.3947], [12.5102, 50.3888], [12.3365, 50.2586], [12.3004, 50.1608], [12.2396, 50.2566], [12.0761, 50.3152], [12.111, 50.2766], [12.0796, 50.2427], [12.1751, 50.1826], [12.1792, 50.118], [12.2469, 50.045], [12.4513, 49.9806], [12.4627, 49.9313], [12.5241, 49.905], [12.4527, 49.7797], [12.3836, 49.7429], [12.4964, 49.67], [12.6435, 49.4295], [12.7779, 49.3325], [12.9998, 49.2949], [13.1785, 49.1183], [13.2995, 49.0936], [13.4589, 48.945], [13.6087, 48.9462], [13.7962, 48.7798], [13.8157, 48.7664]]], [[[14.2101, 53.9385], [14.1753, 53.9065], [14.2008, 53.8782], [13.8401, 53.8503], [13.9317, 53.8993], [13.9045, 53.9954], [13.9727, 53.9892], [13.959, 53.9409], [14.0483, 53.9409], [14.0513, 54.0051], [13.9461, 54.0666], [13.8909, 54.0102], [13.856, 54.0023], [13.8636, 54.05], [13.7741, 54.0228], [13.815, 54.1013], [13.7529, 54.1531], [13.815, 54.1737], [13.8825, 54.1024], [14.2095, 53.9386], [14.2101, 53.9385]]], [[[6.7981, 53.6044], [6.7224, 53.5908], [6.7565, 53.5629], [6.6595, 53.5991], [6.7847, 53.6201], [6.7981, 53.6044]]], [[[6.8738, 53.6728], [7.0855, 53.687], [6.8738, 53.6728]]], [[[7.1331, 53.7081], [7.3462, 53.728], [7.1736, 53.7014], [7.1331, 53.7081]]], [[[7.3665, 53.728], [7.4356, 53.728], [7.3812, 53.7285], [7.3665, 53.728]]], [[[8.1201, 53.7211], [8.196, 53.728], [8.1201, 53.7143], [8.1201, 53.7211]]], [[[7.5174, 53.7621], [7.6272, 53.7509], [7.4819, 53.7271], [7.487, 53.7614], [7.5174, 53.7621]]], [[[7.6609, 53.7621], [7.8128, 53.7831], [7.6686, 53.7579], [7.6609, 53.7621]]], [[[7.8738, 53.7764], [7.9556, 53.7829], [7.8753, 53.7884], [7.8738, 53.7764]]], [[[11.3757, 53.9818], [11.4979, 54.0228], [11.4577, 53.9614], [11.447, 53.9971], [11.391, 53.9739], [11.3757, 53.9818]]], [[[11.5285, 54.0751], [11.6159, 54.1121], [11.5339, 54.057], [11.5285, 54.0751]]], [[[8.9631, 54.5237], [8.888, 54.4685], [8.8128, 54.4821], [8.9192, 54.5305], [8.9631, 54.5237]]], [[[11.2556, 54.4787], [11.3142, 54.4138], [11.1126, 54.4152], [11.0986, 54.4516], [11.0057, 54.4685], [11.0729, 54.5312], [11.24, 54.4956], [11.2556, 54.4787]]], [[[13.1434, 54.5981], [13.0614, 54.4685], [13.1023, 54.5961], [13.1511, 54.6049], [13.1434, 54.5777], [13.1434, 54.5981]]], [[[13.6983, 54.3921], [13.7664, 54.3449], [13.7232, 54.2784], [13.6511, 54.2972], [13.7119, 54.3319], [13.617, 54.3176], [13.6909, 54.3518], [13.4997, 54.3449], [13.3596, 54.2755], [13.3557, 54.2487], [13.4177, 54.2661], [13.4072, 54.2282], [13.3115, 54.2511], [13.3352, 54.2835], [13.2679, 54.2565], [13.1497, 54.2903], [13.1775, 54.3102], [13.1155, 54.3381], [13.1489, 54.3773], [13.2669, 54.3859], [13.157, 54.4268], [13.2731, 54.4821], [13.1434, 54.5429], [13.2595, 54.5538], [13.2979, 54.5197], [13.3694, 54.5851], [13.3489, 54.5237], [13.3767, 54.5646], [13.4307, 54.4927], [13.5071, 54.4883], [13.5208, 54.5708], [13.4414, 54.5572], [13.3692, 54.6121], [13.2533, 54.5646], [13.2935, 54.6423], [13.231, 54.6533], [13.3908, 54.6882], [13.4451, 54.6801], [13.383, 54.6364], [13.4246, 54.5851], [13.6707, 54.5662], [13.5755, 54.4719], [13.6095, 54.4138], [13.6774, 54.4008], [13.6983, 54.3921]]], [[[8.3324, 54.6938], [8.4014, 54.633], [8.3537, 54.619], [8.2915, 54.6671], [8.3425, 54.7014], [8.3324, 54.6938]]], [[[8.4976, 54.7564], [8.5938, 54.7217], [8.5521, 54.685], [8.3945, 54.7148], [8.4641, 54.7548], [8.4976, 54.7564]]], [[[8.3604, 54.9482], [8.3884, 54.8942], [8.6545, 54.8936], [8.3071, 54.8654], [8.2844, 54.7424], [8.298, 54.9125], [8.3737, 55.035], [8.4634, 55.0507], [8.3945, 55.0438], [8.4304, 55.03], [8.3516, 54.9667], [8.3604, 54.9482]]], [[[8.6345, 54.5426], [8.7009, 54.5478], [8.6413, 54.4924], [8.5959, 54.5137], [8.6275, 54.5399], [8.6345, 54.5426]]], [[[7.9041, 54.1804], [7.9006, 54.1907], [7.9041, 54.1804]]], [[[7.9124, 54.1923], [7.9177, 54.187], [7.9124, 54.1923]]]];

// src/view/mapView.ts
function mkSvg(tag, x1, y1, x2, y2) {
  let el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (tag == "circle") {
    el.setAttribute("cx", x1.toString());
    el.setAttribute("cy", y1.toString());
    el.setAttribute("r", "0.01");
    el.setAttribute("fill", "gray");
    return {
      el,
      setColor: (color2) => {
        el.setAttribute("fill", color2);
      }
    };
  } else if (tag == "line") {
    el.setAttribute("x1", x1.toString());
    el.setAttribute("y1", y1.toString());
    el.setAttribute("x2", x2.toString());
    el.setAttribute("y2", y2.toString());
    el.setAttribute("stroke", "gray");
    el.setAttribute("stroke-width", "0.005");
    return {
      el,
      setColor: (color2) => {
        el.setAttribute("stroke", color2);
      }
    };
  } else if (tag == "text") {
    el.setAttribute("x", x1.toString());
    el.setAttribute("y", y1.toString());
    el.setAttribute("text-anchor", "middle");
    el.setAttribute("dominant-baseline", "middle");
    el.textContent = String(x2);
    el.setAttribute("font-size", ".07");
    el.setAttribute("fill", "gray");
    return { el, setColor: (color2) => {
      el.setAttribute("fill", color2);
    } };
  }
  throw new Error("Invalid tag");
}
function mapView(mod) {
  let { roadmap, MAPSIZE } = mod;
  const realMap = "DurationMatrix" in roadmap;
  const xs = roadmap.points.map((point) => point.x);
  const ys = roadmap.points.map((point) => point.y);
  const minX = realMap ? 5.5 : 0;
  const maxX = realMap ? 15.5 : MAPSIZE;
  const minY = realMap ? 47.2 : 0;
  const maxY = realMap ? 55.1 : MAPSIZE;
  const projectX = (x) => realMap ? 0.135 + 0.73 * (x - minX) / Math.max(maxX - minX, 0.000000001) : x / MAPSIZE;
  const projectY = (y) => realMap ? 0.96 - 0.92 * (y - minY) / Math.max(maxY - minY, 0.000000001) : y / MAPSIZE;
  let element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  element.setAttribute("width", "80%");
  element.setAttribute("height", "80%");
  element.setAttribute("viewBox", "0 0 1 1");
  let elements = new Map;
  let sources = new Map;
  if (realMap) {
    const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outline.setAttribute("d", germany_outline_default.map((polygon) => polygon.map((ring) => ring.map(([lon, lat], index) => `${index === 0 ? "M" : "L"}${projectX(lon)} ${projectY(lat)}`).join(" ") + " Z").join(" ")).join(" "));
    outline.setAttribute("fill", "#f1f4f0");
    outline.setAttribute("fill-rule", "evenodd");
    outline.setAttribute("stroke", "#829087");
    outline.setAttribute("stroke-width", "0.003");
    outline.setAttribute("vector-effect", "non-scaling-stroke");
    outline.style.pointerEvents = "none";
    element.appendChild(outline);
  }
  for (let x = 0;!realMap && x < roadmap.points.length; x++) {
    for (let y = 0;y < roadmap.points.length; y++) {
      if (x == y)
        continue;
      let len = roadmap.getroad(x, y);
      if (len == 0 || len == undefined)
        continue;
      let a2 = roadmap.points[x];
      let b = roadmap.points[y];
      let line = mkSvg("line", projectX(a2.x), projectY(a2.y), projectX(b.x), projectY(b.y)).el;
      let id = "road" + roadmap.roadIDX(x, y);
      elements.set(id, line);
      sources.set(line, id);
      element.appendChild(line);
    }
  }
  for (let x = 0;x < roadmap.points.length; x++) {
    let loc = roadmap.points[x];
    let circle = mkSvg("circle", projectX(loc.x), projectY(loc.y)).el;
    if (realMap)
      circle.setAttribute("r", "0.004");
    elements.set(x, circle);
    sources.set(circle, x);
    element.appendChild(circle);
  }
  let hints = [];
  let highlightVersion = 0;
  const geometryCache = new Map;
  function routeGeometry(from, to) {
    const a2 = Math.min(from, to), b = Math.max(from, to);
    const key = `${a2}-${b}`;
    let geometry = geometryCache.get(key);
    if (!geometry) {
      geometry = fetch(`./route-geometry?from=${a2}&to=${b}`).then(async (response) => response.ok ? (await response.json()).coordinates : null).catch(() => null);
      geometryCache.set(key, geometry);
    }
    return geometry.then((coordinates) => coordinates && from > to ? [...coordinates].reverse() : coordinates);
  }
  function routePath(coordinates, color2) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", coordinates.map(([lon, lat], index) => `${index === 0 ? "M" : "L"}${projectX(lon)} ${projectY(lat)}`).join(" "));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color2);
    path.setAttribute("stroke-width", ".006");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    element.appendChild(path);
    return { remove: () => path.remove() };
  }
  hightLights.onupdate((nH, o) => {
    const version = ++highlightVersion;
    hints.forEach((el) => el.remove());
    hints = [];
    for (let n of nH) {
      let last = null;
      for (let p3 of n.points) {
        let next = p3.number;
        if (last !== null) {
          let A = roadmap.points[last];
          let B = roadmap.points[next];
          let line = mkSvg("line", projectX(A.x), projectY(A.y), projectX(B.x), projectY(B.y));
          line.setColor(n.color ?? "#ffc988");
          line.el.setAttribute("stroke-width", "0.01");
          element.appendChild(line.el);
          const fallback = { remove: () => line.el.remove() };
          hints.push(fallback);
          if (realMap && last !== next) {
            routeGeometry(last, next).then((coordinates) => {
              if (version !== highlightVersion || !coordinates)
                return;
              fallback.remove();
              hints = hints.filter((hint) => hint !== fallback);
              hints.push(routePath(coordinates, n.color ?? "#ffc988"));
            });
          }
        }
        last = next;
      }
      for (let p3 of n.points) {
        if (p3.logo) {
          let pos = roadmap.points[p3.number];
          let el = mkSvg("text", projectX(pos.x), projectY(pos.y), p3.logo);
          if (realMap)
            el.el.setAttribute("font-size", ".035");
          el.el.setAttribute("z-index", "1000");
          element.appendChild(el.el);
          hints.push(el.el);
        }
      }
    }
  });
  let dv = div(style({ width: "100%", display: "flex", justifyContent: "center", padding: "1em" }));
  dv.append(element);
  return dv;
}

// src/random.ts
var RANDSEED = 0;
function setRandSeed(seed) {
  RANDSEED = seed;
  RANDSEED = randInt(0, 1e4);
}
function random() {
  let x = Math.sin(RANDSEED++) * 1e4;
  return x - Math.floor(x);
}
function randInt(min, max) {
  return Math.floor(random() * (max - min)) + min;
}
function randChoice(arr) {
  return arr[randInt(0, arr.length)];
}

// src/roadmap.ts
function randomMap(NPOINTS, MAPSIZE) {
  let HPOINT = NPOINTS / 2;
  let RSIZE = NPOINTS * HPOINT;
  let roads = new Uint16Array(RSIZE);
  function roadIDX(a2, b) {
    if (a2 < b)
      [a2, b] = [b, a2];
    let idx = a2 + NPOINTS * b;
    if (idx > RSIZE)
      idx = NPOINTS ** 2 - idx;
    return idx;
  }
  function getroad(a2, b) {
    if (a2 == b)
      throw new Error("Cannot get road from a point to itself");
    return roads[roadIDX(a2, b)];
  }
  function setroad(a2, b, dist) {
    if (a2 == b)
      throw new Error("Cannot set road from a point to itself");
    roads[roadIDX(a2, b)] = dist;
  }
  let range = Array.from({ length: NPOINTS }, (_, i) => i);
  let points = range.map(() => ({ x: randInt(0, MAPSIZE), y: randInt(0, MAPSIZE) }));
  let neighs = points.map((ps, i) => points.map((p22, i2) => ({ d: Math.floor(Math.hypot(ps.x - p22.x, ps.y - p22.y)), i: i2 })).filter((x) => x.i != i).sort((a2, b) => a2.d - b.d));
  function connect(a2, b, dist) {
    if (a2 === b)
      return;
    if (getroad(a2, b) !== 0)
      return;
    setroad(a2, b, dist);
  }
  const connected = new Set([0]);
  while (connected.size < NPOINTS) {
    let bestA = -1;
    let bestB = -1;
    let bestD = Infinity;
    for (const a2 of connected) {
      for (const nei of neighs[a2] ?? []) {
        if (connected.has(nei.i))
          continue;
        if (nei.d < bestD) {
          bestA = a2;
          bestB = nei.i;
          bestD = nei.d;
        }
      }
    }
    if (bestA === -1 || bestB === -1)
      throw new Error("Failed to connect random map");
    connect(bestA, bestB, bestD);
    connected.add(bestB);
  }
  for (let x = 0;x < NPOINTS; x++) {
    const extraEdges = 2 + randInt(0, 3);
    for (let i = 0;i < extraEdges; i++) {
      const nx = neighs[x]?.[i];
      if (!nx)
        continue;
      connect(x, nx.i, nx.d);
    }
  }
  const CostMatrix = new Uint32Array(RSIZE);
  {
    const pointCount = points.length;
    const INF = 65535;
    CostMatrix.fill(INF);
    for (let start = 0;start < pointCount; start++) {
      const dist = new Uint32Array(pointCount);
      const visited = new Uint8Array(pointCount);
      dist.fill(INF);
      dist[start] = 0;
      for (let step = 0;step < pointCount; step++) {
        let current = -1;
        let best = INF;
        for (let node = 0;node < pointCount; node++) {
          if (visited[node] === 0 && dist[node] < best) {
            best = dist[node];
            current = node;
          }
        }
        if (current === -1)
          break;
        visited[current] = 1;
        for (let next = 0;next < pointCount; next++) {
          if (next === current)
            continue;
          const road = getroad(current, next);
          if (road === 0)
            continue;
          const nextCost = dist[current] + road;
          if (nextCost < dist[next]) {
            dist[next] = nextCost;
          }
        }
      }
      for (let end = 0;end < pointCount; end++) {
        if (end === start)
          continue;
        const idx = roadIDX(start, end);
        CostMatrix[idx] = Math.min(dist[end], INF);
      }
    }
  }
  function findPath(start, end) {
    let path = [start];
    let cost = CostMatrix[roadIDX(start, end)];
    while (start != end) {
      for (let x = 0;x < points.length; x++) {
        if (x == start)
          continue;
        let road = getroad(start, x);
        if (road == 0)
          continue;
        let restcost = CostMatrix[roadIDX(x, end)];
        if (road + restcost == cost) {
          cost = restcost;
          start = x;
          path.push(x);
          break;
        }
      }
    }
    return path;
  }
  function getCostN(...points2) {
    let cost = 0;
    for (let i = 0;i < points2.length - 1; i++) {
      if (points2[i] !== points2[i + 1])
        cost += CostMatrix[roadIDX(points2[i], points2[i + 1])];
    }
    return cost;
  }
  return { getroad, roadIDX, points, range, CostMatrix, findPath, getCostN };
}

// src/jsonschema.ts
var typeName = (value) => {
  if (value === null)
    return "null";
  if (Array.isArray(value))
    return "array";
  return typeof value;
};
var pathLabel = (path) => path || "$";
var fail = (path, message) => {
  throw new Error(`Validation error at ${pathLabel(path)}: ${message}`);
};
var isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var deepEqual = (left, right) => {
  if (Object.is(left, right))
    return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => deepEqual(value, right[index]));
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length && leftKeys.every((key) => (key in right) && deepEqual(left[key], right[key]));
  }
  return false;
};
var appendPath = (path, part) => path ? `${path}${part}` : `$${part}`;
var validateObject = (schema, value, path) => {
  if (!isPlainObject(value))
    fail(path, `expected object, got ${typeName(value)}`);
  const objectValue = value;
  const properties = isPlainObject(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  for (const key of required) {
    if (typeof key !== "string")
      continue;
    if (!(key in objectValue))
      fail(appendPath(path, `.${key}`), "is required");
  }
  for (const [key, propertySchema] of Object.entries(properties)) {
    if (!(key in objectValue))
      continue;
    if (!isPlainObject(propertySchema))
      continue;
    validateJsonSchema(propertySchema, objectValue[key], appendPath(path, `.${key}`));
  }
  const extraKeys = Object.keys(objectValue).filter((key) => !(key in properties));
  const additional = schema.additionalProperties;
  if (additional === false) {
    if (extraKeys.length > 0)
      fail(appendPath(path, `.${extraKeys[0]}`), "additional properties are not allowed");
    return;
  }
  if (isPlainObject(additional)) {
    for (const key of extraKeys) {
      validateJsonSchema(additional, objectValue[key], appendPath(path, `.${key}`));
    }
  }
};
var validateArray = (schema, value, path) => {
  if (!Array.isArray(value))
    fail(path, `expected array, got ${typeName(value)}`);
  const arrayValue = value;
  if (!isPlainObject(schema.items))
    return;
  arrayValue.forEach((item, index) => validateJsonSchema(schema.items, item, appendPath(path, `[${index}]`)));
};
var validateByType = (schema, value, path) => {
  switch (schema.type) {
    case "string":
      if (typeof value !== "string")
        fail(path, `expected string, got ${typeName(value)}`);
      return;
    case "number":
      if (typeof value !== "number" || Number.isNaN(value))
        fail(path, `expected number, got ${typeName(value)}`);
      return;
    case "boolean":
      if (typeof value !== "boolean")
        fail(path, `expected boolean, got ${typeName(value)}`);
      return;
    case "null":
      if (value !== null)
        fail(path, `expected null, got ${typeName(value)}`);
      return;
    case "array":
      validateArray(schema, value, path);
      return;
    case "object":
      validateObject(schema, value, path);
      return;
    case undefined:
      return;
    default:
      fail(path, `unsupported schema type ${JSON.stringify(schema.type)}`);
  }
};
var validateJsonSchema = (schema, value, path = "") => {
  if ("const" in schema && !deepEqual(value, schema.const)) {
    fail(path, `expected constant ${JSON.stringify(schema.const)}`);
  }
  if (Array.isArray(schema.anyOf)) {
    const errors = [];
    for (const option of schema.anyOf) {
      if (!isPlainObject(option))
        continue;
      try {
        return validateJsonSchema(option, value, path);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    fail(path, errors[0] ?? "did not match any allowed schema");
  }
  if (Array.isArray(schema.allOf)) {
    for (const option of schema.allOf) {
      if (!isPlainObject(option))
        continue;
      validateJsonSchema(option, value, path);
    }
  }
  validateByType(schema, value, path);
  return value;
};

// src/schema.ts
var validate = (schema, data) => {
  return validateJsonSchema(schema.json, data);
};
var fromJsonSchema = (json) => ({ json });
var string = fromJsonSchema({ type: "string" });
var number = fromJsonSchema({ type: "number" });
var boolean = fromJsonSchema({ type: "boolean" });
var nullSchema = fromJsonSchema({ type: "null" });
var any = fromJsonSchema({});
var array = (itemSchema) => fromJsonSchema({ type: "array", items: itemSchema.json });
var constant = (value) => fromJsonSchema({ const: value });
var object = (shape) => fromJsonSchema({
  type: "object",
  properties: Object.fromEntries(Object.entries(shape).map(([key, field]) => [key, field.json])),
  required: Object.keys(shape)
});
var record = (valueSchema) => fromJsonSchema({ type: "object", additionalProperties: valueSchema.json });
var schemaSchema = record(any);
var union = (...schemas) => fromJsonSchema({ anyOf: schemas.map((s) => s.json) });
function tagged(fields) {
  return union(...Object.entries(fields).map(([$, val]) => object({ $: constant($), val })));
}

// src/types.ts
var UUID = string;
function randomUUID() {
  return "u" + random().toString(16).slice(2, 10) + "-" + random().toString(16).slice(2, 10);
}
var Request = object({
  id: UUID,
  startPoint: number,
  endPoint: number,
  value_eur: number,
  deadline_h: number
});
var Transporter = object({ id: UUID, position: UUID });
var ScheduleStep = tagged({
  pickup: object({ request: UUID, pos: number, deck: union(constant(0), constant(1)) }),
  deliver: object({ request: UUID, pos: number }),
  start: object({ pos: number })
});
var ScheduleItem = object({
  transporter: UUID,
  steps: array(ScheduleStep)
});
var Schedule = array(ScheduleItem);
function randomModule(NREQS = 200, NTRANS = 40, NPOINTS = 100, MAPSIZE = 400, seed = 22) {
  const roadmap = randomMap(NPOINTS, MAPSIZE);
  return {
    NTRANS,
    NREQS,
    MAPSIZE,
    RSIZE: NPOINTS * NPOINTS / 2,
    roadmap,
    requests: Array.from({ length: NREQS }, (_, i) => ({
      id: randomUUID(),
      deadline_h: (1 + random()) * 40,
      startPoint: randChoice(roadmap.range),
      endPoint: randChoice(roadmap.range),
      value_eur: randInt(100, 400)
    })),
    startpositions: Array.from({ length: NTRANS }, (_, i) => randChoice(roadmap.range))
  };
}

// src/writeable.ts
function mkWritable(value) {
  let listeners = [];
  let rep = JSON.stringify(value);
  let res = {
    get: () => value,
    set: (newValue) => {
      let newRep = JSON.stringify(newValue);
      if (newRep === rep)
        return;
      rep = newRep;
      listeners.forEach((listener) => listener(newValue, value));
      value = newValue;
    },
    onupdate: (listener, deferred = false) => {
      if (!deferred)
        listener(value, value);
      listeners.push(listener);
    },
    update: (callback) => {
      let newValue = callback(value) ?? value;
      res.set(newValue);
    }
  };
  return res;
}
function mkStored(key, schema, defaultValue) {
  let val = defaultValue;
  try {
    val = validate(schema, JSON.parse(localStorage.getItem(key)));
  } catch {}
  let res = mkWritable(val);
  res.onupdate((newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue));
  });
  return res;
}

// src/planners/annealing_shared.ts
var KM_COST_CENTS = 50;
var AVG_SPEED_KMH = 60;
var REORG_COST_CENTS = 1e4;
var INF = 1 << 30;
function isLoad(x) {
  return x & 1;
}
function getDeck(x) {
  return (x & 2) >> 1;
}
function getReq(x) {
  return (x & 65535) >> 2;
}
function getPos(x) {
  return x >> 16;
}
function initAnnealingState(mod, seed) {
  const { NREQS, requests, startpositions, NTRANS } = mod;
  const TSIZE = Math.floor(NREQS * 2.5 + 10);
  return {
    mod,
    NREQS,
    NTRANS,
    TSIZE,
    reqPickupLocations: new Uint16Array(requests.map((r) => r.startPoint)),
    reqDeliveryLocations: new Uint16Array(requests.map((r) => r.endPoint)),
    reqDeadlines: new Uint32Array(requests.map((r) => Math.floor(r.deadline_h * 60))),
    reqValues: new Uint32Array(requests.map((r) => Math.round(r.value_eur * 100))),
    unassigned: seed ? new Int8Array(seed.unassigned) : new Int8Array(requests.map(() => 1)),
    tranStart: new Uint16Array(startpositions),
    schedule: seed ? new Uint32Array(seed.schedule) : new Uint32Array(TSIZE * NTRANS),
    scheduleSizes: seed ? new Uint16Array(seed.scheduleSizes) : new Uint16Array(NTRANS),
    scheduleRatings: seed ? new Int32Array(seed.scheduleRatings) : new Int32Array(NTRANS)
  };
}
function routeOffset(state, tran) {
  return tran * state.TSIZE;
}
function setReq(state, tran, idx, isLoadBit, deck, req, pos) {
  state.schedule[routeOffset(state, tran) + idx] = isLoadBit << 0 | deck << 1 | req << 2 | pos << 16;
}
function scoreRoute(state, tran) {
  let reward = 0;
  let cost = 0;
  let elapsedMinutes = 0;
  const decks = [[], []];
  let pos = state.tranStart[tran];
  const offset = routeOffset(state, tran);
  for (let i = 0;i < state.scheduleSizes[tran]; i++) {
    const step = state.schedule[offset + i];
    const load = isLoad(step);
    const req = getReq(step);
    const nextPos = getPos(step);
    const distance = state.mod.roadmap.getCostN(pos, nextPos);
    cost += distance * KM_COST_CENTS;
    elapsedMinutes += distance * 60 / AVG_SPEED_KMH;
    pos = nextPos;
    if (load) {
      const deck = decks[getDeck(step)];
      deck.push(req);
      if (deck.length > 3)
        return -INF;
    } else {
      const deck = decks[getDeck(step)];
      const idx = deck.indexOf(req);
      if (idx === -1)
        return -INF;
      cost += (deck.length - idx - 1) * REORG_COST_CENTS;
      deck.splice(idx, 1);
      if (elapsedMinutes <= state.reqDeadlines[req])
        reward += state.reqValues[req];
    }
  }
  return reward - cost;
}
function bootstrapEmptyRoutes(state, maxLoss = 12000) {
  for (let tran = 0;tran < state.NTRANS; tran++) {
    if (state.scheduleSizes[tran] !== 0)
      continue;
    let bestReq = -1;
    let bestScore = -INF;
    for (let req = 0;req < state.NREQS; req++) {
      if (!state.unassigned[req])
        continue;
      insertStops(state, tran, 0, 0, 0, req);
      const score = scoreRoute(state, tran);
      removeStops(state, tran, 0, 1);
      if (score > bestScore) {
        bestScore = score;
        bestReq = req;
      }
    }
    if (bestReq === -1 || bestScore < -maxLoss)
      continue;
    insertStops(state, tran, 0, 0, 0, bestReq);
    state.scheduleRatings[tran] = bestScore;
    state.unassigned[bestReq] = 0;
  }
}
function insertStops(state, tran, start, end, deck, req) {
  const offset = routeOffset(state, tran);
  const size = state.scheduleSizes[tran];
  state.scheduleSizes[tran] = size + 2;
  state.schedule.copyWithin(offset + end + 2, offset + end, offset + size);
  state.schedule.copyWithin(offset + start + 1, offset + start, offset + end + 1);
  setReq(state, tran, start, 1, deck, req, state.reqPickupLocations[req]);
  setReq(state, tran, end + 1, 0, deck, req, state.reqDeliveryLocations[req]);
}
function removeStops(state, tran, start, end) {
  const offset = routeOffset(state, tran);
  const size = state.scheduleSizes[tran];
  state.scheduleSizes[tran] = size - 2;
  state.schedule.copyWithin(offset + start, offset + start + 1, offset + end);
  state.schedule.copyWithin(offset + end - 1, offset + end + 1, offset + size);
}
function findPairInRoute(state, tran, req) {
  const offset = routeOffset(state, tran);
  const size = state.scheduleSizes[tran];
  let first = -1;
  let second = -1;
  let deck = 0;
  for (let i = 0;i < size; i++) {
    const step = state.schedule[offset + i];
    if (getReq(step) !== req)
      continue;
    if (first === -1) {
      first = i;
      deck = getDeck(step);
    } else {
      second = i;
      break;
    }
  }
  if (first === -1 || second === -1)
    return null;
  return { req, first, second, deck };
}
function sampleUnassignedReq(state, maxAttempts = 24) {
  for (let i = 0;i < maxAttempts; i++) {
    const req = randInt(0, state.NREQS);
    if (state.unassigned[req])
      return req;
  }
  for (let req = 0;req < state.NREQS; req++) {
    if (state.unassigned[req])
      return req;
  }
  return null;
}
function sampleAssignedPair(state, maxAttempts = 24) {
  for (let attempt = 0;attempt < maxAttempts; attempt++) {
    const tran = randInt(0, state.NTRANS);
    const size = state.scheduleSizes[tran];
    if (size < 2)
      continue;
    const idx = randInt(0, size);
    const req = getReq(state.schedule[routeOffset(state, tran) + idx]);
    const pair = findPairInRoute(state, tran, req);
    if (pair)
      return { tran, pair };
  }
  for (let tran = 0;tran < state.NTRANS; tran++) {
    const size = state.scheduleSizes[tran];
    if (size < 2)
      continue;
    const req = getReq(state.schedule[routeOffset(state, tran)]);
    const pair = findPairInRoute(state, tran, req);
    if (pair)
      return { tran, pair };
  }
  return null;
}
function acceptAnneal(prevScore, nextScore, temp) {
  if (nextScore >= prevScore)
    return true;
  const delta = prevScore - nextScore;
  return random() < Math.exp(-delta / Math.max(temp, 0.001));
}
function toAnnealingResult(state, elapsedMs) {
  return {
    schedule: state.schedule,
    scheduleSizes: state.scheduleSizes,
    tranStart: state.tranStart,
    TSIZE: state.TSIZE,
    scheduleRatings: state.scheduleRatings,
    unassigned: state.unassigned,
    elapsedMs,
    totalScore: state.scheduleRatings.reduce((sum, value) => sum + value, 0)
  };
}

// src/planners/annealing_baseline.ts
function baselineAnnealing(mod, steps = 1600000) {
  const state = initAnnealingState(mod);
  const { NREQS, NTRANS, TSIZE, schedule, scheduleSizes, scheduleRatings, unassigned } = state;
  let startTemp = 5000;
  let temp = startTemp;
  bootstrapEmptyRoutes(state);
  function accept(prevRating, nextRating) {
    if (nextRating >= prevRating)
      return true;
    return random() < Math.exp((nextRating - prevRating) / Math.max(temp, 0.001));
  }
  function tryAssign() {
    const tran = randInt(0, NTRANS);
    const schedSize = scheduleSizes[tran];
    const a2 = randInt(0, schedSize + 1);
    const b = Math.min(schedSize, randInt(0, 4) + a2);
    const req = randInt(0, NREQS);
    if (!unassigned[req])
      return;
    insertStops(state, tran, a2, b, random() > 0.5 ? 1 : 0, req);
    const newRating = scoreRoute(state, tran);
    if (accept(scheduleRatings[tran], newRating)) {
      scheduleRatings[tran] = newRating;
      unassigned[req] = 0;
    } else {
      removeStops(state, tran, a2, b + 1);
    }
  }
  function tryUnassign() {
    const tran = randInt(0, NTRANS);
    const schedSize = scheduleSizes[tran];
    if (schedSize < 2)
      return;
    const idx = randInt(0, schedSize);
    const item = schedule[tran * TSIZE + idx];
    const req = getReq(item);
    const ab = [];
    for (let i = 0;i < schedSize; i++) {
      if (getReq(schedule[tran * TSIZE + i]) === req)
        ab.push(i);
    }
    if (ab.length !== 2)
      return;
    const [a2, b] = ab;
    removeStops(state, tran, a2, b);
    const newRating = scoreRoute(state, tran);
    if (accept(scheduleRatings[tran], newRating)) {
      scheduleRatings[tran] = newRating;
      unassigned[req] = 1;
    } else {
      insertStops(state, tran, a2, b - 1, getDeck(item), req);
    }
  }
  const startedAt = Date.now();
  for (let i = 0;i < steps; i++) {
    temp = (1 - i / steps) * startTemp;
    tryUnassign();
    tryAssign();
  }
  return toAnnealingResult(state, Date.now() - startedAt);
}

// src/planners/annealing_improved.ts
function createImprovedAnnealingSession(mod, targetSteps = 150000) {
  const warmupSteps = Math.min(Math.max(20000, Math.floor(targetSteps * 0.2)), 50000);
  const warmup = baselineAnnealing(mod, warmupSteps);
  const state = initAnnealingState(mod, warmup);
  const { NTRANS, scheduleSizes, scheduleRatings, unassigned } = state;
  bootstrapEmptyRoutes(state);
  let startTemp = 6000;
  let endTemp = 25;
  let temp = startTemp;
  function tryAssignSampled(samples = 8) {
    let best = null;
    for (let sample = 0;sample < samples; sample++) {
      const req = sampleUnassignedReq(state);
      if (req == null)
        break;
      const tran = randInt(0, NTRANS);
      const size = scheduleSizes[tran];
      const a2 = randInt(0, size + 1);
      const b = Math.min(size, a2 + randInt(0, Math.min(6, size - a2 + 1)));
      const deck = random() > 0.5 ? 1 : 0;
      insertStops(state, tran, a2, b, deck, req);
      const newScore = scoreRoute(state, tran);
      removeStops(state, tran, a2, b + 1);
      if (!best || newScore > best.score) {
        best = { tran, req, a: a2, b, deck, score: newScore };
      }
    }
    if (!best)
      return;
    insertStops(state, best.tran, best.a, best.b, best.deck, best.req);
    if (acceptAnneal(scheduleRatings[best.tran], best.score, temp)) {
      scheduleRatings[best.tran] = best.score;
      unassigned[best.req] = 0;
    } else {
      removeStops(state, best.tran, best.a, best.b + 1);
    }
  }
  function tryUnassignSampled(samples = 6) {
    let best = null;
    for (let sample = 0;sample < samples; sample++) {
      const chosen = sampleAssignedPair(state);
      if (!chosen)
        break;
      const { tran, pair } = chosen;
      removeStops(state, tran, pair.first, pair.second);
      const newScore = scoreRoute(state, tran);
      insertStops(state, tran, pair.first, pair.second - 1, pair.deck, pair.req);
      if (!best || newScore > best.score) {
        best = { tran, pair, score: newScore };
      }
    }
    if (!best)
      return;
    removeStops(state, best.tran, best.pair.first, best.pair.second);
    if (acceptAnneal(scheduleRatings[best.tran], best.score, temp)) {
      scheduleRatings[best.tran] = best.score;
      unassigned[best.pair.req] = 1;
    } else {
      insertStops(state, best.tran, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }
  function tryRelocateSampled(samples = 8) {
    let best = null;
    for (let sample = 0;sample < samples; sample++) {
      const chosen = sampleAssignedPair(state);
      if (!chosen)
        break;
      const { tran: src, pair } = chosen;
      const dst = randInt(0, NTRANS);
      const oldScore = src === dst ? scheduleRatings[src] : scheduleRatings[src] + scheduleRatings[dst];
      removeStops(state, src, pair.first, pair.second);
      const dstSize = scheduleSizes[dst];
      const a2 = randInt(0, dstSize + 1);
      const b = Math.min(dstSize, a2 + randInt(0, Math.min(6, dstSize - a2 + 1)));
      insertStops(state, dst, a2, b, pair.deck, pair.req);
      const candidateScore = src === dst ? scoreRoute(state, src) : scoreRoute(state, src) + scoreRoute(state, dst);
      removeStops(state, dst, a2, b + 1);
      insertStops(state, src, pair.first, pair.second - 1, pair.deck, pair.req);
      if (!best || candidateScore > best.score) {
        best = {
          src,
          dst,
          pair,
          insertA: a2,
          insertB: b,
          score: candidateScore,
          oldScore
        };
      }
    }
    if (!best)
      return;
    removeStops(state, best.src, best.pair.first, best.pair.second);
    insertStops(state, best.dst, best.insertA, best.insertB, best.pair.deck, best.pair.req);
    if (acceptAnneal(best.oldScore, best.score, temp)) {
      if (best.src === best.dst) {
        scheduleRatings[best.src] = scoreRoute(state, best.src);
      } else {
        scheduleRatings[best.src] = scoreRoute(state, best.src);
        scheduleRatings[best.dst] = scoreRoute(state, best.dst);
      }
    } else {
      removeStops(state, best.dst, best.insertA, best.insertB + 1);
      insertStops(state, best.src, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }
  function tryReinsertSampled(samples = 8) {
    let best = null;
    for (let sample = 0;sample < samples; sample++) {
      const chosen = sampleAssignedPair(state);
      if (!chosen)
        break;
      const { tran, pair } = chosen;
      removeStops(state, tran, pair.first, pair.second);
      const size = scheduleSizes[tran];
      const a2 = randInt(0, size + 1);
      const b = Math.min(size, a2 + randInt(0, Math.min(6, size - a2 + 1)));
      insertStops(state, tran, a2, b, pair.deck, pair.req);
      const candidateScore = scoreRoute(state, tran);
      removeStops(state, tran, a2, b + 1);
      insertStops(state, tran, pair.first, pair.second - 1, pair.deck, pair.req);
      if (!best || candidateScore > best.score) {
        best = {
          tran,
          pair,
          insertA: a2,
          insertB: b,
          score: candidateScore
        };
      }
    }
    if (!best)
      return;
    removeStops(state, best.tran, best.pair.first, best.pair.second);
    insertStops(state, best.tran, best.insertA, best.insertB, best.pair.deck, best.pair.req);
    if (acceptAnneal(scheduleRatings[best.tran], best.score, temp)) {
      scheduleRatings[best.tran] = best.score;
    } else {
      removeStops(state, best.tran, best.insertA, best.insertB + 1);
      insertStops(state, best.tran, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }
  const sessionStartedAt = Date.now();
  let i = 0;
  const tempFloor = 150;
  const reheatTemp = 2250;
  function runIterations(iterationBudget, deadline = Infinity) {
    const endIteration = Math.min(targetSteps, i + iterationBudget);
    while (i < endIteration) {
      if ((i & 2047) === 0 && Date.now() >= deadline)
        break;
      const progress = i / targetSteps;
      temp = startTemp * Math.pow(endTemp / startTemp, progress);
      const r = random();
      if (r < 0.4)
        tryAssignSampled();
      else if (r < 0.55)
        tryUnassignSampled();
      else if (r < 0.85)
        tryReinsertSampled();
      else
        tryRelocateSampled();
      i++;
    }
  }
  function runTimedChunk(budgetMs) {
    const deadline = Date.now() + budgetMs;
    while (Date.now() < deadline) {
      const progress = i / targetSteps;
      temp = Math.max(tempFloor, startTemp * Math.pow(endTemp / startTemp, Math.min(1, progress)));
      const r = random();
      if (r < 0.4)
        tryAssignSampled();
      else if (r < 0.55)
        tryUnassignSampled();
      else if (r < 0.85)
        tryReinsertSampled();
      else
        tryRelocateSampled();
      i++;
    }
  }
  function getResult() {
    return toAnnealingResult(state, warmup.elapsedMs + (Date.now() - sessionStartedAt));
  }
  return {
    iterateSteps(steps) {
      runIterations(steps);
      return getResult();
    },
    iterateForMs(budgetMs) {
      runTimedChunk(budgetMs);
      return getResult();
    },
    getResult,
    reheat(factor = 1) {
      temp = Math.max(temp, reheatTemp * factor);
      i = Math.max(0, i - Math.floor(targetSteps * 0.08 * factor));
      return getResult();
    }
  };
}
function improvedAnnealingCore(mod, options) {
  const targetSteps = options.steps !== undefined ? options.steps : Math.max(150000, Math.floor(options.budgetMs * 190));
  const session = createImprovedAnnealingSession(mod, targetSteps);
  if (options.steps !== undefined)
    return session.iterateSteps(options.steps);
  return session.iterateForMs(options.budgetMs);
}
function improvedAnnealing(mod, steps = 150000) {
  return improvedAnnealingCore(mod, { steps });
}

// src/wasm/ast.ts
var arithmeticOps = ["add", "sub", "mul", "div"];
var bitOps = ["and", "or", "xor", "shl", "shr"];
var remainderOps = ["mod", "umod"];
var cmpOps = ["eq", "lt", "gt"];

class ExprMethods {
}

class MutableMethods extends ExprMethods {
  set(value) {
    const statement = this.write(lit(this.type, value));
    if (statement)
      emit(statement);
  }
}
var nextLocalId = 0;
var recordingStack = [];
var recordingPaused = 0;
var recording = () => recordingPaused ? undefined : recordingStack.at(-1);
var emit = (statement) => {
  recording()?.push(statement);
  return statement;
};
var capture = (build) => {
  const statements = [];
  recordingStack.push(statements);
  try {
    build();
  } finally {
    recordingStack.pop();
  }
  return statements;
};
var withoutRecording = (build) => {
  recordingPaused++;
  try {
    return build();
  } finally {
    recordingPaused--;
  }
};
var inferType = (value) => typeof value === "object" && value !== null && ("type" in value) ? value.type : "i32";
var expr = (node) => {
  return Object.setPrototypeOf(node, ExprMethods.prototype);
};
var lit = (type, value) => {
  if (typeof value === "object" && value !== null) {
    if ("kind" in value)
      return value;
  }
  return expr({ kind: "const", type, value });
};
var mutable = (node, write) => Object.assign(Object.setPrototypeOf(node, MutableMethods.prototype), { write });
var bin = (op, left, right) => recordExpr(expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) }));
var bit = (op, left, right) => recordExpr(expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) }));
var remainder = (op, left, right) => recordExpr(expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) }));
var cmp = (op, left, right) => recordExpr(expr({ kind: "cmp", type: "i32", inputType: left.type, op, left, right: lit(left.type, right) }));
var allocateLocal = (type) => expr({ kind: "local.get", type, local: nextLocalId++ });
var mkLocal = (type) => {
  const local = nextLocalId++;
  return mutable({ kind: "local.get", type, local }, (value) => ({ kind: "local.set", local, type, value }));
};
var recordExpr = (value) => {
  if (!recording())
    return value;
  const snapshot = mkLocal(value.type);
  snapshot.set(value);
  return snapshot;
};
var mkHandle = (params, result, build) => {
  let handle;
  handle = {
    kind: "func",
    params,
    result,
    build,
    call: (...args) => {
      const callArgs = params.map((type2, i) => lit(type2, args[i]));
      if (result === "void")
        return emit({ kind: "call.void", target: handle, args: callArgs });
      const type = typeof result === "string" ? result : result.storage === "i64" ? "i64" : "i32";
      const call = recordExpr(expr({ kind: "call", type, target: handle, args: callArgs }));
      return typeof result === "string" ? call : readStruct(result, call);
    }
  };
  return handle;
};
var loadedType = (type) => type === "i8" || type === "u8" || type === "i16" || type === "u16" ? "i32" : type;
var storageSize = { i8: 1, u8: 1, i16: 2, u16: 2, i32: 4, f32: 4, i64: 8, f64: 8 };
var memoryValue = (array2, index, storage, stride, offset = 0) => {
  const at = lit("i32", index);
  return mutable({ kind: "load", type: loadedType(storage), array: array2, index: at, storage, stride, offset }, (value) => ({ kind: "array.store", array: array2, type: storage, index: at, stride, offset, value }));
};
var readField = (backing, field) => {
  const { bits } = field;
  if (field.storage === "i64")
    return backing;
  if (backing.type === "i64") {
    const bitOffset = BigInt(field.bitOffset), mask2 = (1n << BigInt(bits)) - 1n;
    const raw2 = i32(backing.shr(bitOffset).and(mask2));
    return field.storage.startsWith("i") && bits < 32 ? ifElse(raw2.and(2 ** (bits - 1)), raw2.sub(2 ** bits), raw2) : raw2;
  }
  if (field.storage === "i32" && field.bitOffset === 0)
    return backing;
  const mask = 2 ** bits - 1;
  const raw = backing.shr(field.bitOffset).and(mask);
  return field.storage.startsWith("i") && bits < 32 ? ifElse(raw.and(2 ** (bits - 1)), raw.sub(2 ** bits), raw) : raw;
};
var packedFieldValue = (backing, field) => {
  const value = readField(backing, field);
  if (field.storage === "i64")
    return backing;
  if (backing.type === "i64") {
    const bitOffset = BigInt(field.bitOffset), mask2 = (1n << BigInt(field.bits)) - 1n;
    const fieldMask2 = mask2 << bitOffset;
    return mutable(value, (input) => backing.set(backing.and(~fieldMask2).or(i64u(input).and(mask2).shl(bitOffset))));
  }
  if (field.storage === "i32" && field.bitOffset === 0)
    return backing;
  const mask = 2 ** field.bits - 1, fieldMask = mask << field.bitOffset;
  return mutable(value, (input) => backing.set(backing.and(~fieldMask).or(input.and(mask).shl(field.bitOffset))));
};
var readStruct = (type, packed) => withoutRecording(() => Object.assign(Object.fromEntries(Object.keys(type.fields).map((name) => [name, readField(packed, type.layout[name])])), { packed, structType: type }));
var structValue = (type, packed) => {
  const fields = withoutRecording(() => Object.fromEntries(Object.keys(type.fields).map((name) => [name, packedFieldValue(packed, type.layout[name])])));
  return Object.assign(fields, { packed, structType: type, set: (value) => packed.set("packed" in value ? value.packed : packStruct(type, value)) });
};
var packStruct = (type, values) => {
  if (type.storage !== "i64")
    return Object.keys(type.fields).reduce((packed, name) => {
      const field = type.layout[name], value = values[name];
      const mask = 2 ** field.bits - 1;
      return packed.or(lit("i32", value).and(mask).shl(field.bitOffset));
    }, i32(0));
  return Object.keys(type.fields).reduce((packed, name) => {
    const field = type.layout[name], value = values[name];
    if (field.storage === "i64")
      return lit("i64", value);
    const mask = (1n << BigInt(field.bits)) - 1n;
    return packed.or(i64u(lit("i32", value)).and(mask).shl(BigInt(field.bitOffset)));
  }, i64(0n));
};
var struct = (fields) => {
  if ("set" in fields || "packed" in fields || "structType" in fields)
    throw new Error("Struct fields cannot be named set, packed, or structType");
  let used = 0;
  const layout = {};
  for (const name of Object.keys(fields)) {
    const field = fields[name];
    const storage2 = Array.isArray(field) ? field[0] : field;
    const bits = Array.isArray(field) ? field[1] : storageSize[storage2] * 8;
    if (!Number.isInteger(bits) || bits < 1 || bits > storageSize[storage2] * 8)
      throw new Error(`Invalid ${storage2} bit-field width ${bits}`);
    if (used + bits > 64)
      throw new Error(`Struct requires ${used + bits} bits; maximum is 64`);
    layout[name] = { storage: storage2, bitOffset: used, bits };
    used += bits;
  }
  const storage = used <= 8 ? "u8" : used <= 16 ? "u16" : used <= 32 ? "i32" : "i64";
  return { kind: "struct", fields, layout, storage, size: storageSize[storage] };
};
var cast = (type, value, unsigned = false) => value.type === type ? value : recordExpr(expr({ kind: "cast", type, inputType: value.type, unsigned, value }));
var number2 = (type, value) => typeof value === (type === "i64" ? "bigint" : "number") ? expr({ kind: "const", type, value }) : cast(type, value);
function i32(value) {
  return number2("i32", value);
}
function i64(value) {
  return number2("i64", value);
}
var i64u = (value) => cast("i64", value, true);
function f32(value) {
  return number2("f32", value);
}
var ifElse = (cond, then, else_) => recordExpr(expr({ kind: "if", type: then.type, cond, then, else: else_ }));
var arithmetic = Object.fromEntries(arithmeticOps.map((op) => [
  op,
  (left, right) => bin(op, left, right)
]));
var bits = Object.fromEntries(bitOps.map((op) => [
  op,
  (left, right) => bit(op, left, right)
]));
var remainders = Object.fromEntries(remainderOps.map((op) => [
  op,
  (left, right) => remainder(op, left, right)
]));
var comparisons = Object.fromEntries(cmpOps.map((op) => [
  op,
  (left, right) => cmp(op, left, right)
]));
for (const op of arithmeticOps)
  Object.defineProperty(ExprMethods.prototype, op, {
    value(right) {
      return arithmetic[op](this, right);
    }
  });
for (const op of bitOps)
  Object.defineProperty(ExprMethods.prototype, op, {
    value(right) {
      return bits[op](this, right);
    }
  });
for (const op of remainderOps)
  Object.defineProperty(ExprMethods.prototype, op, {
    value(right) {
      return remainders[op](this, right);
    }
  });
for (const op of cmpOps)
  Object.defineProperty(ExprMethods.prototype, op, {
    value(right) {
      return comparisons[op](this, right);
    }
  });
for (const op of [...arithmeticOps, "and", "or", "xor"])
  Object.defineProperty(MutableMethods.prototype, `i${op}`, {
    value(right) {
      return this.set(this[op](right));
    }
  });
var fn = (params, result, build) => mkHandle(params, result, (...args) => {
  let returned = undefined;
  const statements = capture(() => {
    returned = build(...args);
  });
  if (Array.isArray(returned))
    throw new Error("WASM functions record statements; returning statement arrays is not supported");
  if (returned !== undefined) {
    const value = typeof returned === "object" && "packed" in returned ? returned.packed : returned;
    statements.push({ kind: "return", value });
  }
  return statements;
});
function array2(type, length) {
  if (!Number.isInteger(length) || length <= 0)
    throw new Error(`Invalid array length ${length}`);
  const struct2 = typeof type === "object" ? type : null;
  const storage = struct2 ? struct2.storage : type;
  const elementSize = struct2 ? struct2.size : storageSize[storage];
  let handle;
  handle = {
    kind: "array",
    type,
    length,
    elementSize,
    at: (index) => {
      const value = memoryValue(handle, index, storage, elementSize);
      return struct2 ? structValue(struct2, value) : value;
    },
    move: (target, source, count) => emit({ kind: "array.move", array: handle, target: lit("i32", target), source: lit("i32", source), count: lit("i32", count) })
  };
  return handle;
}
var mkStructLocal = (type) => structValue(type, mkLocal(type.storage === "i64" ? "i64" : "i32"));
var local = (type) => typeof type === "string" ? mkLocal(type) : mkStructLocal(type);
function variable(initialOrType, initial) {
  if (typeof initialOrType === "object" && initialOrType.kind === "struct") {
    const value2 = local(initialOrType);
    if (initial !== undefined)
      value2.set(initial);
    return value2;
  }
  if (typeof initialOrType === "object" && initialOrType && "structType" in initialOrType) {
    const value2 = local(initialOrType.structType);
    value2.set(initialOrType);
    return value2;
  }
  const value = local(inferType(initialOrType));
  value.set(initialOrType);
  return value;
}
var expImpl = fn(["f32"], "f32", (x) => {
  const y = variable(ifElse(x.lt(-16), f32(-16), ifElse(x.gt(16), f32(16), x)).div(2048).add(1));
  for (let i = 0;i < 11; i++)
    y.imul(y);
  return y;
});
var exp = (value) => expImpl.call(value);
var global = (type, initial) => {
  let value;
  value = mutable({ kind: "global.get", type, initial }, (input) => ({ kind: "global.set", global: value, value: input }));
  return value;
};
var return_ = (value) => {
  if (value === undefined)
    emit({ kind: "return" });
  else if (typeof value === "object" && "packed" in value)
    emit({ kind: "return", value: value.packed });
  else
    emit({ kind: "return", value: lit(inferType(value), value) });
};
var trap = (message) => {
  emit({ kind: "trap", message });
};
var log = (message, value) => {
  emit({ kind: "log", message, value: lit("i32", value) });
};
var when = (condition, then, else_) => {
  emit({ kind: "if", cond: lit("i32", condition), then: capture(then), else: else_ ? capture(else_) : [] });
};
var for_ = (start, end, body2) => {
  const index = mkLocal("i32");
  emit({ kind: "for", local: index.local, start: lit("i32", start), end: lit("i32", end), body: capture(() => body2(index)) });
};
// src/wasm/analyze.ts
var die = (x) => {
  throw new Error(`Unexpected value: ${String(x)}`);
};
var walk = (node, fns) => {
  if (node == null)
    return;
  if (Array.isArray(node))
    return node.forEach((x) => walk(x, fns));
  const children = (...values) => values.forEach((x) => walk(x, fns));
  switch (node.kind) {
    case "const":
      return;
    case "local.get":
      fns.local?.(node.local, node.type);
      return;
    case "local.set":
      fns.local?.(node.local, node.type);
      return walk(node.value, fns);
    case "global.get":
      fns.global?.(node);
      return;
    case "global.set":
      fns.global?.(node.global);
      return walk(node.value, fns);
    case "bin":
    case "cmp":
      return children(node.left, node.right);
    case "call":
    case "call.void":
      fns.func?.(node.target);
      return walk(node.args, fns);
    case "cast":
    case "return":
      return walk(node.value, fns);
    case "if":
      return children(node.cond, node.then, node.else);
    case "load":
      fns.array?.(node.array);
      return walk(node.index, fns);
    case "array.store":
      fns.array?.(node.array);
      return children(node.index, node.value);
    case "array.move":
      fns.array?.(node.array);
      return children(node.target, node.source, node.count);
    case "loop":
      return children(node.cond, node.body);
    case "for":
      fns.local?.(node.local, "i32");
      return children(node.start, node.end, node.body);
    case "trap":
      fns.trap?.(node.message);
      return;
    case "log":
      fns.log?.(node.message);
      return walk(node.value, fns);
    default:
      die(node);
  }
};
var arrayLayouts = (arrays) => {
  let offset = 0;
  const layouts = new Map;
  for (const arr of arrays) {
    const align = Math.min(arr.elementSize, 8);
    offset = Math.ceil(offset / align) * align;
    layouts.set(arr, { length: arr.length, offset, elementSize: arr.elementSize });
    offset += arr.length * arr.elementSize;
  }
  return { layouts, bytes: offset };
};
var buildFunc = (func) => {
  const params = func.params.map((type) => allocateLocal(type));
  const paramIds = params.map((p3) => p3.kind === "local.get" ? p3.local : -1);
  const result = func.build(...params);
  const built = result;
  const found = new Map;
  const functions = new Set, arrays = new Set, globals = new Set, traps = new Set, logs = new Set;
  walk(built, {
    local: (id, type) => found.set(id, type),
    func: (f) => functions.add(f),
    array: (a2) => arrays.add(a2),
    global: (value) => globals.add(value),
    trap: (message) => traps.add(message),
    log: (message) => logs.add(message)
  });
  paramIds.forEach((id) => found.delete(id));
  const locals = [...found.entries()];
  const localIndexes = Object.fromEntries([
    ...paramIds.map((id, i) => [id, i]),
    ...locals.map(([id], i) => [id, func.params.length + i])
  ]);
  return { func, built, locals, localIndexes, functions: [...functions], arrays: [...arrays], globals: [...globals], traps: [...traps], logs: [...logs] };
};
var buildReferencedFunctions = (roots) => {
  const built = new Map;
  const visit = (func) => {
    if (built.has(func))
      return;
    const entry = buildFunc(func);
    built.set(func, entry);
    entry.functions.forEach(visit);
  };
  roots.forEach(visit);
  return [...built.values()];
};
var analyzeModule = (mod) => {
  const entries = Object.entries(mod);
  const funcs = Object.fromEntries(entries.filter(([, v]) => v.kind === "func"));
  const arrays = Object.fromEntries(entries.filter(([, v]) => v.kind === "array"));
  const fEntries = Object.entries(funcs);
  const builtFuncs = buildReferencedFunctions(fEntries.map(([, func]) => func));
  const fix = new Map(builtFuncs.map(({ func }, i) => [func, i]));
  const allArrays = [...new Set([...builtFuncs.flatMap((func) => func.arrays), ...Object.values(arrays)])];
  const allGlobals = [...new Set([...builtFuncs.flatMap((func) => func.globals), ...entries.filter(([, v]) => v.kind === "global.get").map(([, v]) => v)])];
  const globals = new Map(allGlobals.map((value, i) => [value, i]));
  const { layouts, bytes } = arrayLayouts(allArrays);
  const trapMessages = [...new Set(builtFuncs.flatMap((func) => func.traps))];
  const logMessages = [...new Set(builtFuncs.flatMap((func) => func.logs))];
  return { funcs, arrays, fEntries, builtFuncs, fix, layouts, globals, trapMessages, logMessages, pages: Math.max(1, Math.ceil(bytes / 65536)) };
};
// src/wasm/codegen.ts
var magic = [0, 97, 115, 109, 1, 0, 0, 0];
var resultType = (result) => typeof result === "object" ? result.storage === "i64" ? "i64" : "i32" : result;
var numberBase = { i32: 106, i64: 124, f32: 146, f64: 160 };
var opcode = (op, type) => {
  const arithmetic2 = ["add", "sub", "mul", "div"].indexOf(op);
  if (arithmetic2 >= 0)
    return numberBase[type] + arithmetic2;
  const integer = ["mod", "umod", "and", "or", "xor", "shl", "", "shr"].indexOf(op);
  if (integer >= 0)
    return numberBase[type] + 5 + integer;
  return { i32: 70, i64: 81, f32: 91, f64: 97 }[type] + (op === "eq" ? 0 : op === "lt" ? 2 : type[0] === "i" ? 4 : 3);
};
var codes = {
  type: { i32: 127, i64: 126, f32: 125, f64: 124 },
  load: { i32: 40, i64: 41, f32: 42, f64: 43, i8: 44, u8: 45, i16: 46, u16: 47 },
  store: { i32: 54, i64: 55, f32: 56, f64: 57, i8: 58, u8: 58, i16: 59, u16: 59 },
  align: { i8: 0, u8: 0, i16: 1, u16: 1, i32: 2, f32: 2, i64: 3, f64: 3 },
  zero: { i32: [65, 0], i64: [66, 0], f32: [67, 0, 0, 0, 0], f64: [68, 0, 0, 0, 0, 0, 0, 0, 0] }
};
var u32 = (n) => {
  if (!Number.isInteger(n) || n < 0)
    throw new Error(`Expected unsigned integer, got ${n}`);
  const out = [];
  do {
    let byte = n & 127;
    n >>>= 7;
    if (n)
      byte |= 128;
    out.push(byte);
  } while (n);
  return out;
};
var sN = (value, bits2) => {
  const out = [];
  let n = bits2 === 32 ? BigInt(value | 0) : BigInt.asIntN(64, value);
  for (;; ) {
    let byte = Number(n & 0x7fn);
    n >>= 7n;
    const done = n === 0n && (byte & 64) === 0 || n === -1n && (byte & 64) !== 0;
    if (!done)
      byte |= 128;
    out.push(byte);
    if (done)
      return out;
  }
};
var fN = (value, bytes) => {
  const out = new Uint8Array(bytes);
  const view = new DataView(out.buffer);
  bytes === 4 ? view.setFloat32(0, value, true) : view.setFloat64(0, value, true);
  return [...out];
};
var globalInit = (value) => value.type === "i32" ? [65, ...sN(value.initial, 32)] : value.type === "i64" ? [66, ...sN(value.initial, 64)] : value.type === "f32" ? [67, ...fN(value.initial, 4)] : [68, ...fN(value.initial, 8)];
var str = (s) => {
  const bytes = new TextEncoder().encode(s);
  return [...u32(bytes.length), ...bytes];
};
var section = (id, payload) => [id, ...u32(payload.length), ...payload];
var flatMap = (xs, fn2) => xs.flatMap(fn2);
var die2 = (x) => {
  throw new Error(`Unexpected value: ${String(x)}`);
};
var addr = (layout, index, stride = layout.elementSize, fieldOffset = 0) => index.mul(stride).add(layout.offset + fieldOffset);
var memarg = (type, offset = 0) => [...u32(codes.align[type]), ...u32(offset)];
var constI32 = (e) => e.kind === "const" ? e.value : null;
var checkArrayBounds = (layout, index) => {
  const n = constI32(index);
  if (n == null)
    return;
  if (!Number.isInteger(n) || n < 0 || n >= layout.length)
    throw new Error(`Array index ${n} out of bounds for length ${layout.length}`);
};
var checkMoveBounds = (layout, target, source, count) => {
  const values = [constI32(target), constI32(source), constI32(count)];
  if (values.some((value) => value == null))
    return;
  const [to, from, size] = values;
  if (to < 0 || from < 0 || size < 0 || to + size > layout.length || from + size > layout.length)
    throw new Error(`Array move (${to}, ${from}, ${size}) out of bounds for length ${layout.length}`);
};
var makeCompiler = (fix, lix, arrays, traps, logs, globals) => {
  const compileExpr = (e) => {
    switch (e.kind) {
      case "const":
        if (e.type === "i32")
          return [65, ...sN(e.value, 32)];
        if (e.type === "i64")
          return [66, ...sN(e.value, 64)];
        if (e.type === "f32")
          return [67, ...fN(e.value, 4)];
        if (e.type === "f64")
          return [68, ...fN(e.value, 8)];
        return die2(e);
      case "local.get":
        return [32, ...u32(lix[e.local])];
      case "global.get":
        return [35, ...u32(globals.get(e))];
      case "bin": {
        return [...compileExpr(e.left), ...compileExpr(e.right), opcode(e.op, e.type)];
      }
      case "cmp":
        return [...compileExpr(e.left), ...compileExpr(e.right), opcode(e.op, e.inputType)];
      case "call":
        return [...flatMap(e.args, compileExpr), 16, ...u32(fix.get(e.target) + 2)];
      case "cast": {
        const from = e.inputType;
        const to = e.type;
        let opcode2;
        if (to === "i32" && from === "i64")
          opcode2 = 167;
        if (to === "i32" && from === "f32")
          opcode2 = 168;
        if (to === "i32" && from === "f64")
          opcode2 = 170;
        if (to === "i64" && from === "i32")
          opcode2 = e.unsigned ? 173 : 172;
        if (to === "f32" && from === "i32")
          opcode2 = 178;
        if (to === "f32" && from === "i64")
          opcode2 = 180;
        if (to === "f32" && from === "f64")
          opcode2 = 182;
        if (to === "f64" && from === "i32")
          opcode2 = 183;
        if (to === "f64" && from === "i64")
          opcode2 = 185;
        if (to === "f64" && from === "f32")
          opcode2 = 187;
        if (opcode2 == null)
          throw new Error(`Unsupported cast ${from} -> ${to}`);
        return [...compileExpr(e.value), opcode2];
      }
      case "if":
        return [...compileExpr(e.cond), 4, codes.type[e.type], ...compileExpr(e.then), 5, ...compileExpr(e.else), 11];
      case "load": {
        const layout = arrays.get(e.array);
        if (!layout)
          throw new Error(`Unknown array ${e.array}`);
        checkArrayBounds(layout, e.index);
        return [...compileExpr(addr(layout, e.index, e.stride, e.offset)), codes.load[e.storage], ...memarg(e.storage)];
      }
      default:
        return die2(e);
    }
  };
  const compileStmt = (s) => {
    switch (s.kind) {
      case "local.set":
        return [...compileExpr(s.value), 33, ...u32(lix[s.local])];
      case "global.set":
        return [...compileExpr(s.value), 36, ...u32(globals.get(s.global))];
      case "array.store": {
        const layout = arrays.get(s.array);
        if (!layout)
          throw new Error(`Unknown array ${s.array}`);
        checkArrayBounds(layout, s.index);
        return [...compileExpr(addr(layout, s.index, s.stride, s.offset)), ...compileExpr(s.value), codes.store[s.type], ...memarg(s.type)];
      }
      case "array.move": {
        const layout = arrays.get(s.array);
        if (!layout)
          throw new Error(`Unknown array ${s.array}`);
        checkMoveBounds(layout, s.target, s.source, s.count);
        return [
          ...compileExpr(addr(layout, s.target)),
          ...compileExpr(addr(layout, s.source)),
          ...compileExpr(s.count.mul(layout.elementSize)),
          252,
          10,
          0,
          0
        ];
      }
      case "if":
        return [...compileExpr(s.cond), 4, 64, ...flatMap(s.then, compileStmt), ...s.else.length ? [5, ...flatMap(s.else, compileStmt)] : [], 11];
      case "loop":
        return [2, 64, 3, 64, ...compileExpr(s.cond), 69, 13, ...u32(1), ...flatMap(s.body, compileStmt), 12, ...u32(0), 11, 11];
      case "for": {
        const index = lix[s.local];
        return [
          ...compileExpr(s.start),
          33,
          ...u32(index),
          2,
          64,
          3,
          64,
          32,
          ...u32(index),
          ...compileExpr(s.end),
          72,
          69,
          13,
          ...u32(1),
          ...flatMap(s.body, compileStmt),
          32,
          ...u32(index),
          65,
          1,
          106,
          33,
          ...u32(index),
          12,
          ...u32(0),
          11,
          11
        ];
      }
      case "return":
        return [...s.value ? compileExpr(s.value) : [], 15];
      case "trap":
        return [65, ...sN(traps.get(s.message), 32), 16, 0];
      case "log":
        return [65, ...sN(logs.get(s.message), 32), ...compileExpr(s.value), 16, 1];
      case "call.void":
        return [...flatMap(s.args, compileExpr), 16, ...u32(fix.get(s.target) + 2)];
      default:
        return die2(s);
    }
  };
  return { expr: compileExpr, stmt: compileStmt };
};
var emitModule = ({ fEntries, builtFuncs, fix, layouts, globals, trapMessages, logMessages, pages }) => {
  const traps = new Map(trapMessages.map((message, id) => [message, id]));
  const logs = new Map(logMessages.map((message, id) => [message, id]));
  const functionSection = builtFuncs.flatMap((_, i) => u32(i + 2));
  const exportSection = fEntries.flatMap(([name, func]) => [...str(name), 0, ...u32(fix.get(func) + 2)]);
  return new Uint8Array([
    ...magic,
    ...section(1, [
      ...u32(builtFuncs.length + 2),
      96,
      1,
      codes.type.i32,
      0,
      96,
      2,
      codes.type.i32,
      codes.type.i32,
      0,
      ...flatMap(builtFuncs, ({ func }) => {
        const result = resultType(func.result);
        return [96, ...u32(func.params.length), ...func.params.map((t) => codes.type[t]), ...result === "void" ? [0] : [1, codes.type[result]]];
      })
    ]),
    ...section(2, [
      3,
      ...str("env"),
      ...str("trap"),
      0,
      0,
      ...str("env"),
      ...str("log"),
      0,
      1,
      ...str("env"),
      ...str("memory"),
      2,
      3,
      ...u32(pages),
      ...u32(pages)
    ]),
    ...section(3, [...u32(builtFuncs.length), ...functionSection]),
    ...globals.size ? section(6, [...u32(globals.size), ...[...globals].flatMap(([value]) => [codes.type[value.type], 1, ...globalInit(value), 11])]) : [],
    ...section(7, [...u32(fEntries.length), ...exportSection]),
    ...section(10, [
      ...u32(builtFuncs.length),
      ...flatMap(builtFuncs, ({ func, built, locals, localIndexes }) => {
        const compiler = makeCompiler(fix, localIndexes, layouts, traps, logs, globals);
        const decls = [...u32(locals.length), ...flatMap(locals, ([, type]) => [...u32(1), codes.type[type]])];
        const result = resultType(func.result);
        const code = [...flatMap(built, (s) => compiler.stmt(s)), ...result === "void" ? [] : codes.zero[result]];
        const body2 = [...decls, ...code, 11];
        return [...u32(body2.length), ...body2];
      })
    ])
  ]);
};

// src/wasm/index.ts
var arrayCtors = {
  i8: Int8Array,
  u8: Uint8Array,
  i16: Int16Array,
  u16: Uint16Array,
  i32: Int32Array,
  i64: BigInt64Array,
  f32: Float32Array,
  f64: Float64Array,
  su8: Uint8Array,
  su16: Uint16Array,
  si32: Uint32Array,
  si64: BigUint64Array
};
var decodeStruct = (type, raw) => {
  const packed = BigInt.asUintN(type.size * 8, BigInt(raw));
  return Object.fromEntries(Object.entries(type.layout).map(([name, field]) => {
    const mask = (1n << BigInt(field.bits)) - 1n;
    let value = packed >> BigInt(field.bitOffset) & mask;
    if (field.storage.startsWith("i") && value & 1n << BigInt(field.bits - 1))
      value -= 1n << BigInt(field.bits);
    return [name, field.storage === "i64" ? value : Number(value)];
  }));
};
var compile = async (mod) => {
  const analysis = analyzeModule(mod);
  const memory = new WebAssembly.Memory({
    initial: analysis.pages,
    maximum: analysis.pages,
    shared: true
  });
  const compiled = await WebAssembly.compile(emitModule(analysis).buffer);
  const trap2 = (id) => {
    throw new Error(analysis.trapMessages[id] ?? `Unknown WASM trap ${id}`);
  };
  const log2 = (id, value) => console.log(analysis.logMessages[id] ?? `WASM log ${id}`, value);
  const instance = await WebAssembly.instantiate(compiled, { env: { memory, trap: trap2, log: log2 } });
  const funcEntries = Object.entries(analysis.funcs);
  const jsFuncs = {}, resultStructs = {};
  for (const [name, func] of funcEntries) {
    const wasmFunc = instance.exports[name];
    jsFuncs[name] = wasmFunc;
    if (typeof func.result === "object") {
      resultStructs[name] = func.result;
      jsFuncs[name] = (...args) => decodeStruct(func.result, wasmFunc(...args));
    }
  }
  const jsArrays = Object.entries(analysis.arrays).map(([name, arr]) => {
    const layout = analysis.layouts.get(arr);
    const key = typeof arr.type === "string" ? arr.type : `s${arr.type.storage}`;
    const Ctor = arrayCtors[key];
    return [name, new Ctor(memory.buffer, layout.offset, arr.length)];
  });
  return Object.assign(jsFuncs, Object.fromEntries(jsArrays), {
    mod: compiled,
    memory,
    resultStructs,
    trapMessages: analysis.trapMessages,
    logMessages: analysis.logMessages
  });
};

// src/planners/annealing_wasm.ts
var TEMP_PHASES = 1000;
var END_TEMP_CENTS = 0;
var defaultWasmSearchParams = {
  steps: 160000,
  startTemperature: 2500,
  nudgeRadius: 4,
  assignWeight: 3,
  unassignWeight: 1,
  nudgeWeight: 3,
  relocateWeight: 3,
  rngSeed: 1
};
var DEBUG = false;
var debug = (tag, value) => {
  if (DEBUG)
    log(tag, value);
};
function checkedArray(type, length) {
  const arr = array2(type, length);
  if (!DEBUG)
    return arr;
  const { at, move } = arr;
  const checkIdx = fn(["i32", "i32"], "i32", (i, n) => {
    when(i.lt(0).or(n.lt(0)).or(n.add(i).gt(arr.length)), () => trap("array bounds exceeded"));
    return i;
  });
  arr.at = (index) => at(checkIdx.call(index, 1));
  arr.move = (target, source, count) => {
    move(checkIdx.call(target, count), checkIdx.call(source, count), count);
  };
  return arr;
}
async function annealingWasm(planner, options = {}) {
  const params = { ...defaultWasmSearchParams, ...options };
  const stepsPerPhase = Math.floor(params.steps / TEMP_PHASES);
  const assignEnd = params.assignWeight;
  const unassignEnd = assignEnd + params.unassignWeight;
  const nudgeEnd = unassignEnd + params.nudgeWeight;
  const totalWeight = nudgeEnd + params.relocateWeight;
  const TSIZE = Math.floor(planner.NREQS / planner.NTRANS * 2.5 * 2 + 10);
  const NPOINTS = planner.roadmap.points.length;
  const STOP = struct({
    req_id: ["u16", 10],
    is_load: ["u8", 1],
    deck: ["u8", 1]
  });
  const REQ = struct({
    start: "u16",
    end: "u16",
    value: "u16",
    deadline: "u16"
  });
  const randState = global("i32", params.rngSeed || 1);
  const dists = checkedArray("i32", planner.RSIZE);
  const requests = checkedArray(REQ, planner.NREQS);
  const assigned = checkedArray("u8", planner.NREQS);
  const schedule = checkedArray(STOP, planner.NTRANS * TSIZE);
  const sched_size = checkedArray("i16", planner.NTRANS);
  const ratings = checkedArray("i32", planner.NTRANS);
  const tran_positions = checkedArray("i16", planner.NTRANS);
  const randNext = fn([], "i32", () => {
    randState.set(randState.xor(randState.shl(13)));
    randState.set(randState.xor(randState.shr(17)));
    randState.set(randState.xor(randState.shl(5)));
    return randState;
  });
  const randint = fn(["i32"], "i32", (max) => i32(i64u(randNext.call()).mul(i64u(max)).shr(32n)));
  const acceptAnneal2 = fn(["i32", "i32", "i32"], "i32", (previous, next, temperature) => {
    when(previous.gt(next), () => {
      return_(randint.call(1e6).lt(i32(exp(f32(next.sub(previous)).div(f32(temperature))).mul(1e6))));
    });
    return i32(1);
  });
  const roadCost = fn(["i32", "i32"], "i32", (from, to) => {
    const lo = variable(to.add(from.sub(to).mul(from.lt(to))));
    const index = variable(from.add(to).sub(lo).add(lo.mul(NPOINTS)));
    index.set(index.add(index.gt(planner.RSIZE).mul(i32(NPOINTS ** 2).sub(index.mul(2)))));
    return dists.at(index).mul(from.eq(to).eq(0));
  });
  const rateTran = fn(["i32"], "i32", (tran) => {
    const reward = variable(0), cost = variable(0), elapsedMinutes = variable(0);
    const pos = variable(tran_positions.at(tran));
    const offset = tran.mul(TSIZE), size = variable(sched_size.at(tran));
    const deck0 = variable(0), deck1 = variable(0), deckSize0 = variable(0), deckSize1 = variable(0);
    for_(0, size, (i) => {
      const step = variable(schedule.at(offset.add(i)));
      const req = variable(step.req_id);
      const request = variable(requests.at(req));
      const nextPos = variable(ifElse(step.is_load, request.start, request.end));
      const distance = variable(roadCost.call(pos, nextPos));
      cost.iadd(distance.mul(KM_COST_CENTS));
      elapsedMinutes.iadd(distance);
      pos.set(nextPos);
      const deck = variable(ifElse(step.deck, deck1, deck0));
      const deckSize = variable(ifElse(step.deck, deckSize1, deckSize0));
      when(step.is_load, () => {
        when(deckSize.gt(2), () => return_(-INF));
        deck.set(deck.or(req.shl(deckSize.mul(10))));
        deckSize.iadd(1);
      }, () => {
        const found = variable(-1);
        when(deckSize.gt(0).and(deck.and(1023).eq(req)), () => found.set(0));
        when(found.eq(-1).and(deckSize.gt(1)).and(deck.shr(10).and(1023).eq(req)), () => found.set(1));
        when(found.eq(-1).and(deckSize.gt(2)).and(deck.shr(20).and(1023).eq(req)), () => found.set(2));
        when(found.eq(-1), () => return_(-INF));
        cost.iadd(deckSize.sub(found).sub(1).mul(REORG_COST_CENTS));
        const shift = found.mul(10);
        const lowerMask = i32(1).shl(shift).sub(1);
        deck.set(deck.and(lowerMask).or(deck.shr(shift.add(10)).shl(shift)));
        deckSize.isub(1);
        when(elapsedMinutes.gt(request.deadline).eq(0), () => reward.iadd(request.value));
      });
      when(step.deck, () => {
        deck1.set(deck);
        deckSize1.set(deckSize);
      }, () => {
        deck0.set(deck);
        deckSize0.set(deckSize);
      });
    });
    return reward.sub(cost);
  });
  const tryAssign = fn(["i32"], "void", (temperature) => {
    const tran = randint.call(planner.NTRANS);
    const req_id = randint.call(planner.NREQS);
    const schedView = {
      move: (target, source, count) => schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index) => schedule.at(toffset.add(index))
    };
    when(assigned.at(req_id).eq(1), () => return_());
    const toffset = tran.mul(TSIZE);
    const tsize = variable(sched_size.at(tran));
    when(tsize.gt(TSIZE - 2), () => return_());
    const previousScore = variable(ratings.at(tran));
    const A = randint.call(tsize.add(1));
    const B = variable(A.add(randint.call(4)));
    when(B.gt(tsize), () => B.set(tsize));
    schedView.move(B.add(2), B, tsize.sub(B));
    schedView.move(A.add(1), A, B.sub(A));
    const tmp = randint.call(2);
    schedView.at(A).set({ req_id, is_load: 1, deck: tmp });
    schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp });
    sched_size.at(tran).set(tsize.add(2));
    const nextScore = rateTran.call(tran);
    when(acceptAnneal2.call(previousScore, nextScore, temperature), () => {
      assigned.at(req_id).set(1);
      ratings.at(tran).set(nextScore);
    }, () => {
      schedView.move(A, A.add(1), B.sub(A));
      schedView.move(B, B.add(2), tsize.sub(B));
      sched_size.at(tran).set(tsize);
    });
  });
  const tryUnassign = fn(["i32"], "void", (temperature) => {
    const tran = randint.call(planner.NTRANS);
    const A = variable(-1), B = variable(-1);
    const tsize = variable(sched_size.at(tran));
    const schedView = {
      move: (target, source, count) => schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index) => schedule.at(toffset.add(index))
    };
    when(tsize.lt(2), () => return_());
    const toffset = tran.mul(TSIZE);
    const selected = variable(schedView.at(randint.call(tsize)));
    const req = variable(selected.req_id);
    const deck = variable(selected.deck);
    for_(0, tsize, (i) => {
      const step = variable(schedView.at(i));
      when(step.req_id.eq(req), () => when(A.eq(-1), () => A.set(i), () => B.set(i)));
    });
    when(A.eq(-1).or(B.eq(-1)), () => return_());
    const previousScore = variable(ratings.at(tran));
    schedView.move(A, A.add(1), B.sub(A).sub(1));
    schedView.move(B.sub(1), B.add(1), tsize.sub(B).sub(1));
    sched_size.at(tran).set(tsize.sub(2));
    const nextScore = rateTran.call(tran);
    when(acceptAnneal2.call(previousScore, nextScore, temperature), () => {
      assigned.at(req).set(0);
      ratings.at(tran).set(nextScore);
    }, () => {
      schedView.move(B.add(1), B.sub(1), tsize.sub(B).sub(1));
      schedView.move(A.add(1), A, B.sub(A).sub(1));
      schedView.at(A).set({ req_id: req, is_load: 1, deck });
      schedView.at(B).set({ req_id: req, is_load: 0, deck });
      sched_size.at(tran).set(tsize);
    });
  });
  const tryRelocate = fn(["i32"], "void", (temperature) => {
    const src = randint.call(planner.NTRANS), dst = randint.call(planner.NTRANS);
    const A = variable(-1), B = variable(-1);
    const srcView = {
      move: (target, source, count) => schedule.move(srcOffset.add(target), srcOffset.add(source), count),
      at: (index) => schedule.at(srcOffset.add(index))
    };
    const dstView = {
      move: (target, source, count) => schedule.move(dstOffset.add(target), dstOffset.add(source), count),
      at: (index) => schedule.at(dstOffset.add(index))
    };
    when(src.eq(dst), () => return_());
    const srcSize = variable(sched_size.at(src));
    const dstSize = variable(sched_size.at(dst));
    when(srcSize.lt(2).or(dstSize.gt(TSIZE - 2)), () => return_());
    const srcOffset = src.mul(TSIZE);
    const dstOffset = dst.mul(TSIZE);
    const selected = variable(srcView.at(randint.call(srcSize)));
    const req = variable(selected.req_id);
    const deck = variable(selected.deck);
    for_(0, srcSize, (i) => {
      const step = variable(srcView.at(i));
      when(step.req_id.eq(req), () => when(A.eq(-1), () => A.set(i), () => B.set(i)));
    });
    when(A.eq(-1).or(B.eq(-1)), () => return_());
    const previousScore = ratings.at(src).add(ratings.at(dst));
    srcView.move(A, A.add(1), B.sub(A).sub(1));
    srcView.move(B.sub(1), B.add(1), srcSize.sub(B).sub(1));
    sched_size.at(src).set(srcSize.sub(2));
    const C = randint.call(dstSize.add(1));
    const D = variable(C.add(randint.call(4)));
    when(D.gt(dstSize), () => D.set(dstSize));
    dstView.move(D.add(2), D, dstSize.sub(D));
    dstView.move(C.add(1), C, D.sub(C));
    dstView.at(C).set({ req_id: req, is_load: 1, deck });
    dstView.at(D.add(1)).set({ req_id: req, is_load: 0, deck });
    sched_size.at(dst).set(dstSize.add(2));
    const nextSrc = rateTran.call(src);
    const nextDst = rateTran.call(dst);
    when(acceptAnneal2.call(previousScore, nextSrc.add(nextDst), temperature), () => {
      ratings.at(src).set(nextSrc);
      ratings.at(dst).set(nextDst);
    }, () => {
      dstView.move(C, C.add(1), D.sub(C));
      dstView.move(D, D.add(2), dstSize.sub(D));
      sched_size.at(dst).set(dstSize);
      srcView.move(B.add(1), B.sub(1), srcSize.sub(B).sub(1));
      srcView.move(A.add(1), A, B.sub(A).sub(1));
      srcView.at(A).set({ req_id: req, is_load: 1, deck });
      srcView.at(B).set({ req_id: req, is_load: 0, deck });
      sched_size.at(src).set(srcSize);
    });
  });
  const tryNudgeStop = fn(["i32"], "void", (temperature) => {
    const tran = randint.call(planner.NTRANS), size = variable(sched_size.at(tran));
    const first = variable(0), end = variable(0);
    when(size.lt(2), () => return_());
    const offset = tran.mul(TSIZE);
    const from = randint.call(size);
    const selected = variable(schedule.at(offset.add(from)));
    const roll = randint.call(params.nudgeRadius * 2);
    const target = variable(from.add(ifElse(roll.lt(params.nudgeRadius), roll.sub(params.nudgeRadius), roll.sub(params.nudgeRadius - 1))));
    when(target.lt(0), () => target.set(0));
    when(target.gt(size.sub(1)), () => target.set(size.sub(1)));
    when(target.eq(from), () => return_());
    when(target.lt(from), () => {
      first.set(target);
      end.set(from);
    }, () => {
      first.set(from.add(1));
      end.set(target.add(1));
    });
    for_(first, end, (i) => {
      const crossed = variable(schedule.at(offset.add(i)));
      when(crossed.req_id.eq(selected.req_id), () => return_());
    });
    const previousScore = variable(ratings.at(tran));
    when(target.lt(from), () => schedule.move(offset.add(target.add(1)), offset.add(target), from.sub(target)), () => schedule.move(offset.add(from), offset.add(from.add(1)), target.sub(from)));
    schedule.at(offset.add(target)).set(selected);
    const nextScore = rateTran.call(tran);
    when(acceptAnneal2.call(previousScore, nextScore, temperature), () => {
      ratings.at(tran).set(nextScore);
    }, () => {
      when(target.lt(from), () => schedule.move(offset.add(target), offset.add(target.add(1)), from.sub(target)), () => schedule.move(offset.add(from.add(1)), offset.add(from), target.sub(from)));
      schedule.at(offset.add(from)).set(selected);
    });
  });
  const addRequest = fn(["i32", "i32", "i32", "i32", "i32"], "void", (reqn, start, end, value, deadline) => {
    requests.at(reqn).set({ start, end, value, deadline });
  });
  const bootstrap = fn([], "void", () => {
    for_(0, planner.NTRANS, (tran) => {
      const offset = tran.mul(TSIZE);
      const bestReq = variable(-1), bestScore = variable(-INF), score = variable(0);
      for_(0, planner.NREQS, (req) => {
        when(assigned.at(req).eq(0), () => {
          schedule.at(offset).set({ req_id: req, is_load: 1, deck: 0 });
          schedule.at(offset.add(1)).set({ req_id: req, is_load: 0, deck: 0 });
          sched_size.at(tran).set(2);
          score.set(rateTran.call(tran));
          when(score.gt(bestScore), () => {
            bestScore.set(score);
            bestReq.set(req);
          });
          sched_size.at(tran).set(0);
        });
      });
      when(bestReq.gt(-1).and(bestScore.gt(-12001)), () => {
        schedule.at(offset).set({ req_id: bestReq, is_load: 1, deck: 0 });
        schedule.at(offset.add(1)).set({ req_id: bestReq, is_load: 0, deck: 0 });
        sched_size.at(tran).set(2);
        assigned.at(bestReq).set(1);
        ratings.at(tran).set(bestScore);
      });
    });
  });
  const search = fn([], "void", () => {
    debug("debugger on.", 0);
    for_(0, TEMP_PHASES, (phase) => {
      const temperature = i32(params.startTemperature).sub(phase.mul(params.startTemperature - END_TEMP_CENTS).div(TEMP_PHASES - 1));
      for_(0, stepsPerPhase, () => {
        const move = randint.call(totalWeight);
        when(move.lt(assignEnd), () => tryAssign.call(temperature), () => {
          when(move.lt(unassignEnd), () => tryUnassign.call(temperature), () => {
            when(move.lt(nudgeEnd), () => tryNudgeStop.call(temperature), () => tryRelocate.call(temperature));
          });
        });
      });
    });
  });
  const getStop = fn(["i32", "i32"], STOP, (tran, index) => schedule.at(tran.mul(TSIZE).add(index)));
  const wasm = await compile({
    addRequest,
    assigned,
    bootstrap,
    dists,
    getStop,
    rateTran,
    ratings,
    schedule,
    search,
    sched_size,
    tran_positions
  });
  wasm.dists.set(planner.roadmap.CostMatrix);
  wasm.tran_positions.set(planner.startpositions);
  planner.requests.forEach((request, i) => wasm.addRequest(i, request.startPoint, request.endPoint, Math.round(request.value_eur * 100), Math.floor(request.deadline_h * 60)));
  wasm.bootstrap();
  const startedAt = performance.now();
  wasm.search();
  const elapsedMs = performance.now() - startedAt;
  const resultSchedule = new Uint32Array(planner.NTRANS * TSIZE);
  for (let tran = 0;tran < planner.NTRANS; tran++) {
    for (let i = 0;i < wasm.sched_size[tran]; i++) {
      const stop = wasm.getStop(tran, i);
      resultSchedule[tran * TSIZE + i] = stop.is_load | stop.deck << 1 | stop.req_id << 2;
    }
  }
  const unassigned = new Int8Array(planner.NREQS);
  for (let i = 0;i < unassigned.length; i++)
    unassigned[i] = wasm.assigned[i] ? 0 : 1;
  const scheduleRatings = new Int32Array(wasm.ratings);
  return {
    schedule: resultSchedule,
    scheduleSizes: new Uint16Array(wasm.sched_size),
    tranStart: new Uint16Array(planner.startpositions),
    TSIZE,
    scheduleRatings,
    unassigned,
    elapsedMs,
    totalScore: scheduleRatings.reduce((sum, score) => sum + score, 0)
  };
}

// src/planners/viewPlan.ts
var availableSolvers = {
  wasm: annealingWasm,
  baseline: baselineAnnealing,
  improved: improvedAnnealing
};
var INITIAL_SOLVER = "wasm";
var euros = (cents) => `${(cents / 100).toFixed(2)}€`;

class ScoreMismatchError extends Error {
}
function canonicalSchedule(mod, result) {
  const schedule = new Uint32Array(result.schedule);
  for (let tran = 0;tran < mod.NTRANS; tran++) {
    const size = result.scheduleSizes[tran];
    if (size < 0 || size > result.TSIZE)
      throw new ScoreMismatchError(`Transporter ${tran} has invalid schedule size ${size}`);
    for (let i = 0;i < size; i++) {
      const at = tran * result.TSIZE + i;
      const step = schedule[at];
      if (step === undefined)
        throw new ScoreMismatchError(`Transporter ${tran} schedule is truncated at ${i}`);
      const req = getReq(step), request = mod.requests[req];
      if (!request)
        throw new ScoreMismatchError(`Transporter ${tran} references unknown request ${req}`);
      const pos = isLoad(step) ? request.startPoint : request.endPoint;
      schedule[at] = step & 65535 | pos << 16;
    }
  }
  return schedule;
}
function checkedResult(mod, result) {
  if (result.scheduleSizes.length !== mod.NTRANS || result.scheduleRatings.length !== mod.NTRANS)
    throw new ScoreMismatchError("Solver returned incorrectly sized transporter arrays");
  const schedule = canonicalSchedule(mod, result);
  const state = initAnnealingState(mod);
  Object.assign(state, {
    TSIZE: result.TSIZE,
    schedule,
    scheduleSizes: result.scheduleSizes,
    scheduleRatings: result.scheduleRatings,
    tranStart: result.tranStart,
    unassigned: result.unassigned
  });
  let total = 0;
  for (let tran = 0;tran < mod.NTRANS; tran++) {
    const expected = scoreRoute(state, tran), reported = result.scheduleRatings[tran];
    if (reported !== expected)
      throw new ScoreMismatchError(`Transporter ${tran} score mismatch: reported ${reported}, JS ${expected}`);
    total += expected;
  }
  if (result.totalScore !== total)
    throw new ScoreMismatchError(`Total score mismatch: reported ${result.totalScore}, JS ${total}`);
  return result;
}
async function plannerView(mod) {
  const outerBorder = "1px solid " + color.gray;
  const cellPadding = ".35em .5em";
  let annealer = null;
  let annealingSession = null;
  let annealingTimer = null;
  let runId = 0;
  function itemButton(item, load, deck) {
    const req = mod.requests[item];
    const requestButton = span(item.toString().padStart(3, " "), style({
      cursor: "pointer",
      display: "inline-block",
      padding: ".15em .35em",
      color: load === true ? color.blue : load === false ? color.green : color.color,
      whiteSpace: "pre",
      fontFamily: "monospace"
    }), function() {
      popup(p("item ", item), table(tr(cell("status"), cell(load ? "load" : load === false ? "unload" : "unassigned")), tr(cell("value"), cell(req.value_eur + "€")), tr(cell("dist"), cell(mod.roadmap.getCostN(req.startPoint, req.endPoint) + "km")), tr(cell("deadline"), cell(req.deadline_h.toFixed(2) + "h"))));
    });
    let points = [
      { number: req.startPoint, logo: "\uD83D\uDCE6" },
      { number: req.endPoint, logo: "\uD83C\uDFE0" }
    ];
    if (load === true)
      points = [points[0]];
    if (load === false)
      points = [points[1]];
    const result = deck === undefined ? span(requestButton, style({ border: outerBorder, borderRadius: ".25em", background: color.lightgray })) : div([0, 1].map((deckIndex) => div(deckIndex === deck ? requestButton : " ", style({
      boxSizing: "border-box",
      minWidth: "3.1em",
      minHeight: "1.55em",
      textAlign: "center",
      borderTop: deckIndex === 1 ? outerBorder : "none"
    }))), style({ border: outerBorder, borderRadius: ".2em", overflow: "hidden" }));
    result.onmouseenter = () => {
      result.style.outline = `2px solid ${color.green}`;
      hightLights.set([{ points }]);
    };
    result.onmouseleave = () => {
      result.style.outline = "none";
      hightLights.set([]);
    };
    return result;
  }
  const cell = (...x) => td(style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), ...x);
  const controls = div(style({ display: "flex", gap: ".5em", alignItems: "center", flexWrap: "wrap" }));
  const scoreLine = p();
  const timeLine = p();
  const solverSelect = select(...Object.keys(availableSolvers));
  const solverLine = p("solver: ", solverSelect);
  const detailWrap = div();
  const tableWrap = div(style({
    overflowX: "auto",
    overflowY: "hidden",
    maxWidth: "100%"
  }));
  const runButton = button("start");
  const heatButton = button("heat up");
  let renderCounter = 0;
  function stopSearch() {
    if (annealingTimer != null) {
      clearInterval(annealingTimer);
      annealingTimer = null;
    }
    runButton.textContent = "start";
  }
  function renderTable() {
    const tab = table(style({
      borderCollapse: "collapse",
      width: "100%",
      tableLayout: "fixed"
    }), tr(th("transporter", style({ border: outerBorder, padding: cellPadding, textAlign: "left", width: "8em" })), th("value", style({ border: outerBorder, padding: cellPadding, textAlign: "right", width: "7em" })), th("steps", style({ border: outerBorder, padding: cellPadding, textAlign: "left" }))), mod.startpositions.map((start, tran) => tr(cell(tran, style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), function() {
      popup(p("transporter: ", tran), p("start: ", start), p("score: ", euros(annealer?.scheduleRatings[tran] ?? 0)), p("steps: ", annealer?.scheduleSizes[tran]));
    }, {
      onmouseenter: () => {
        const points = [{ number: start, logo: "\uD83D\uDE9B" }];
        if (annealer) {
          for (let i = 0;i < annealer.scheduleSizes[tran]; i++) {
            const step = annealer.schedule[tran * annealer.TSIZE + i];
            const request = mod.requests[getReq(step)];
            points.push({ number: isLoad(step) ? request.startPoint : request.endPoint, logo: "" });
          }
        }
        hightLights.set([{ points }]);
      },
      onmouseleave: () => {
        hightLights.set([]);
      }
    }), td(euros(annealer?.scheduleRatings[tran] ?? 0), style({ border: outerBorder, padding: cellPadding, textAlign: "right", verticalAlign: "top" })), td(div(Array.from({ length: annealer?.scheduleSizes[tran] ?? 0 }, (_, i) => {
      const step = annealer.schedule[tran * annealer.TSIZE + i];
      return itemButton(getReq(step), !!isLoad(step), getDeck(step));
    }), style({
      display: "flex",
      flexWrap: "wrap",
      alignItems: "flex-start",
      gap: ".3em",
      minHeight: "3.1em"
    })), style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" })))));
    tableWrap.replaceChildren(tab);
  }
  function renderStatus() {
    if (!annealer)
      return;
    scoreLine.textContent = `score: ${euros(annealer.totalScore)}`;
    timeLine.textContent = `search time: ${(annealer.elapsedMs / 1000).toFixed(2)} s`;
    detailWrap.replaceChildren(div(p("details"), table(style({
      borderCollapse: "collapse"
    }), tr(cell("unassigned requests"), cell(Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]))), tr(cell("search time"), cell(`${annealer?.elapsedMs ?? 0}ms`)), tr(cell("score"), cell(euros(annealer.totalScore))), tr(cell("transporter count"), cell(mod.NTRANS)), tr(cell("request count"), cell(mod.NREQS)), tr(cell("cost per km"), cell(euros(KM_COST_CENTS))), tr(cell("average speed"), cell(`${AVG_SPEED_KMH}km/h`)), tr(cell("reorganization cost"), cell(euros(REORG_COST_CENTS))))));
  }
  function render(forceTable = false) {
    if (!annealer)
      return;
    renderStatus();
    if (forceTable || renderCounter++ % 4 === 0)
      renderTable();
  }
  async function runSolver(name) {
    stopSearch();
    const id = ++runId;
    annealingSession = null;
    annealer = null;
    runButton.disabled = true;
    scoreLine.textContent = "running…";
    tableWrap.replaceChildren();
    let result = null;
    try {
      if (name === "improved") {
        annealingSession = createImprovedAnnealingSession(mod, 150000);
        result = annealingSession.iterateForMs(420);
      } else {
        result = await availableSolvers[name](mod);
      }
      annealer = checkedResult(mod, result);
      if (id === runId) {
        render(true);
      }
    } catch (error) {
      if (error instanceof ScoreMismatchError)
        throw error;
      if (id === runId)
        scoreLine.textContent = `solver failed: ${String(error)}`;
    } finally {
      if (id === runId) {
        runButton.disabled = false;
        runButton.textContent = name === "improved" ? "start" : "run";
        heatButton.hidden = name !== "improved";
      }
    }
  }
  runButton.onclick = () => {
    const name = solverSelect.value;
    if (name !== "improved") {
      runSolver(name);
      return;
    }
    if (annealingTimer != null) {
      stopSearch();
      return;
    }
    runButton.textContent = "stop";
    annealingTimer = window.setInterval(() => {
      if (!annealingSession)
        return;
      annealer = checkedResult(mod, annealingSession.iterateForMs(120));
      render();
    }, 150);
  };
  heatButton.onclick = () => {
    if (!annealingSession)
      return;
    annealer = checkedResult(mod, annealingSession.reheat());
    render(true);
  };
  solverSelect.onchange = () => void runSolver(solverSelect.value);
  controls.replaceChildren(runButton, heatButton);
  await runSolver(INITIAL_SOLVER);
  return div(style({
    padding: "1em",
    overflowY: "auto",
    overflowX: "hidden",
    height: "100%",
    boxSizing: "border-box",
    minHeight: "0"
  }), controls, solverLine, scoreLine, timeLine, tableWrap, detailWrap);
}

// src/view/wasmview.ts
var result;
async function setUpWasm(planner) {
  result = await annealingWasm(planner);
}
function wasmView(_planner) {
  if (!result)
    throw new Error("WASM planner is not set up");
  return div(style({ padding: "1em" }), h2("WASM planner"), p("assigned: ", result.unassigned.length - result.unassigned.reduce((sum, value) => sum + value, 0)), p("schedule steps: ", result.scheduleSizes.reduce((sum, value) => sum + value, 0)), p("search time: ", result.elapsedMs.toFixed(2), "ms"));
}

// src/hash.ts
var CHUNK_START = 1 << 0;
var CHUNK_END = 1 << 1;
var PARENT = 1 << 2;
var ROOT = 1 << 3;

// src/real_roadmap.ts
var REAL_ROADMAP_VERSION = 1;
function packedRoadIndex(pointCount, from, to) {
  if (from === to)
    throw new Error("Cannot get a road from a point to itself");
  let a2 = from;
  let b = to;
  if (a2 < b)
    [a2, b] = [b, a2];
  let index = a2 + pointCount * b;
  const packedSize = pointCount * pointCount / 2;
  if (index > packedSize)
    index = pointCount ** 2 - index;
  return index;
}
function realRoadMapFromCache(cache) {
  if (cache.version !== REAL_ROADMAP_VERSION) {
    throw new Error(`Unsupported real-roadmap cache version ${cache.version}`);
  }
  const pointCount = cache.sites.length;
  if (pointCount % 2 !== 0) {
    throw new Error("The existing packed WASM matrix layout requires an even number of sites");
  }
  const matrixSize = pointCount * pointCount / 2;
  if (cache.distancesKm.length !== matrixSize || cache.durationsMinutes.length !== matrixSize) {
    throw new Error(`Invalid real-roadmap matrix size for ${pointCount} sites`);
  }
  const CostMatrix = Uint32Array.from(cache.distancesKm);
  const DurationMatrix = Uint32Array.from(cache.durationsMinutes);
  const points = cache.sites.map((site) => ({
    x: site.lon,
    y: site.lat,
    lon: site.lon,
    lat: site.lat,
    id: site.id,
    name: site.name
  }));
  const range = Array.from({ length: pointCount }, (_, index) => index);
  const roadIDX = (from, to) => packedRoadIndex(pointCount, from, to);
  const getroad = (from, to) => CostMatrix[roadIDX(from, to)];
  const findPath = (from, to) => from === to ? [from] : [from, to];
  const getCostN = (...stops) => sumLegs(CostMatrix, roadIDX, stops);
  const getDurationMinutesN = (...stops) => sumLegs(DurationMatrix, roadIDX, stops);
  return {
    points,
    range,
    CostMatrix,
    DurationMatrix,
    roadIDX,
    getroad,
    findPath,
    getCostN,
    getDurationMinutesN,
    cache
  };
}
function sumLegs(matrix, index, stops) {
  let total = 0;
  for (let i = 0;i + 1 < stops.length; i++) {
    if (stops[i] !== stops[i + 1])
      total += matrix[index(stops[i], stops[i + 1])];
  }
  return total;
}
function realModule(roadmap, NREQS = 200, NTRANS = 40, seed = 22) {
  if (roadmap.points.length < 2)
    throw new Error("A real roadmap needs at least two dealer sites");
  setRandSeed(seed);
  const differentPoint = (from) => {
    let to = randChoice(roadmap.range);
    while (to === from)
      to = randChoice(roadmap.range);
    return to;
  };
  const requests = Array.from({ length: NREQS }, () => {
    const startPoint = randChoice(roadmap.range);
    const endPoint = differentPoint(startPoint);
    const directMinutes = roadmap.getDurationMinutesN(startPoint, endPoint);
    return {
      id: randomUUID(),
      startPoint,
      endPoint,
      value_eur: randInt(150, 600),
      deadline_h: (directMinutes + 4 * 60 + random() * 36 * 60) / 60
    };
  });
  return {
    NTRANS,
    NREQS,
    MAPSIZE: 1,
    RSIZE: roadmap.CostMatrix.length,
    roadmap,
    requests,
    startpositions: Array.from({ length: NTRANS }, () => randChoice(roadmap.range))
  };
}

// src/view/main.ts
var LKW_COUNT = mkStored("LKW_COUNT_V2", number, 40);
var REQUEST_COUNT = mkStored("REQUEST_COUNT_V2", number, 200);
body.style.margin = "0";
var header = h1("route planner", style({ background: color.blue, color: color.background, margin: "0", padding: ".6em" }));
var contentSpace = div(style({
  display: "flex",
  flexDirection: "row",
  width: "100%",
  height: "calc(100% - 2.5em)",
  minWidth: "0"
}));
var page = div(style({ display: "flex", flexDirection: "column", height: "100%" }), header, contentSpace);
body.replaceChildren(page);
setRandSeed(24);
async function initialModule() {
  try {
    const response = await fetch("./real-roadmap.json");
    if (!response.ok)
      throw new Error(await response.text());
    const cache = await response.json();
    const roadmap = realRoadMapFromCache(cache);
    console.info(`Using cached real roadmap with ${roadmap.points.length} car dealers`);
    return realModule(roadmap, REQUEST_COUNT.get(), LKW_COUNT.get(), 24);
  } catch (error) {
    console.info("Using synthetic roadmap; build the real-roadmap cache to enable Germany data", error);
    return randomModule(REQUEST_COUNT.get(), LKW_COUNT.get());
  }
}
var module = await initialModule();
var hightLights = mkWritable([]);
await setUpWasm(module);
async function mkWindow(tab = 0) {
  let tabFields = [
    ["map", mapView(module)],
    ["planner", await plannerView(module)],
    ["wasm", wasmView(module)]
  ];
  const el = div(style({
    flex: "1 1 0",
    minWidth: "0",
    height: "calc(100vh - 1em)",
    border: "1px solid " + color.gray,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  }));
  function openTab(tab2) {
    const tabs = p(style({
      margin: "0",
      padding: ".4em",
      flex: "0 0 auto"
    }), tabFields.map(([n, e]) => span(n, () => openTab(n), style({
      padding: ".3em",
      margin: ".3em",
      cursor: "pointer",
      border: "1px solid " + (n == tab2 ? color.color : color.gray),
      color: n == tab2 ? color.color : color.gray
    }))));
    const content = div(style({
      flex: "1 1 auto",
      minHeight: "0",
      minWidth: "0"
    }), tabFields.find(([n]) => n == tab2)[1]);
    el.replaceChildren(tabs, content);
  }
  openTab(tabFields[tab][0]);
  return el;
}
contentSpace.replaceChildren(...await Promise.all([mkWindow(1), mkWindow()]));
export {
  module,
  hightLights,
  LKW_COUNT
};

//# debugId=7FE02E5CDC1773EF64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3dhc20vYXN0LnRzIiwgInNyYy93YXNtL2FuYWx5emUudHMiLCAic3JjL3dhc20vY29kZWdlbi50cyIsICJzcmMvd2FzbS9pbmRleC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3dhc20udHMiLCAic3JjL3BsYW5uZXJzL3ZpZXdQbGFuLnRzIiwgInNyYy92aWV3L3dhc212aWV3LnRzIiwgInNyYy9oYXNoLnRzIiwgInNyYy9yZWFsX3JvYWRtYXAudHMiLCAic3JjL3ZpZXcvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsKICAgICJcbmltcG9ydCB0eXBlIHsgSnNvbkRhdGEgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5leHBvcnQgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cbmNvbnN0IGNvbG9yUGFsZXR0ZSA9IHtcbiAgbGlnaHQ6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiMwMDBcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjZmZmXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDI0MiwgNTUsIDU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYig1NywgMjE0LCAzOSlcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoNSwgMjgsIDE0MSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoMjEsIDEzNywgMjM5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM4ODhcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjZTVlNWU1XCIsXG4gIH0sXG4gIGRhcms6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiNmZmZcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjMjIyXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDE5OCwgMjAsIDApXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDk1LCAxNTksIDI1NSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoOTUsIDEwMCwgMjU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYigwLCAxODUsIDE5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM1NjU2NTZcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjNDE0MTQxXCIsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbG9yID0ge1xuICBjb2xvcjogXCJ2YXIoLS1jb2xvcilcIixcbiAgYmFja2dyb3VuZDogXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiLFxuICBibHVlOiBcInZhcigtLWJsdWUpXCIsXG4gIGxpZ2h0Qmx1ZTogXCJ2YXIoLS1saWdodGJsdWUpXCIsXG4gIHJlZDogXCJ2YXIoLS1yZWQpXCIsXG4gIGdyZWVuOiBcInZhcigtLWdyZWVuKVwiLFxuICBncmF5OiBcInZhcigtLWdyYXkpXCIsXG4gIGxpZ2h0Z3JheTogXCJ2YXIoLS1saWdodGdyYXkpXCJcbn1cblxuXG5sZXQgc3R5bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKVxuc3R5bC5pbm5lckhUTUwgPSBgXG46cm9vdCB7XG4gIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmRhcmsuY29sb3J9O1xuICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmFja2dyb3VuZH07XG4gIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5kYXJrLnJlZH07XG4gIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JlZW59O1xuICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmx1ZX07XG4gIC0tZ3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5ncmF5fTtcbiAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsubGlnaHRncmF5fTtcbiAgY29sb3I6IHZhcigtLWNvbG9yKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZCk7XG4gIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgOnJvb3Qge1xuICAgIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmNvbG9yfTtcbiAgICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJhY2tncm91bmR9O1xuICAgIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5saWdodC5yZWR9O1xuICAgIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyZWVufTtcbiAgICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJsdWV9O1xuICAgIC0tZ3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JheX07XG4gICAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmxpZ2h0Z3JheX07XG4gIH1cbn1cbmBcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bClcblxuZXhwb3J0IHR5cGUgaHRtbEtleSA9ICdpbm5lclRleHQnfCdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdvbmtleWRvd24nIHwgJ29ubW91c2VlbnRlcicgfCAnb25tb3VzZW92ZXInIHwgJ29ubW91c2VleGl0JyB8J2NoaWxkcmVuJ3wnY2xhc3MnfCdpZCd8J2NvbnRlbnRFZGl0YWJsZSd8J2V2ZW50TGlzdGVuZXJzJ3wnY29sb3InfCdiYWNrZ3JvdW5kJyB8ICdzdHlsZScgfCAncGxhY2Vob2xkZXInIHwgJ3RhYkluZGV4JyB8ICdjb2xTcGFuJyB8ICd0eXBlJ1xuZXhwb3J0IGNvbnN0IGh0bWxFbGVtZW50ID0gKHRhZzpzdHJpbmcsIHRleHQ6c3RyaW5nLCBhcmdzPzpQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+Pik6SFRNTEVsZW1lbnQgPT57XG5cbiAgY29uc3QgX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcbiAgX2VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gIGxldCBzdCA9IF9lbGVtZW50LnN0eWxlXG4gIGlmICh0YWcgPT0gXCJidXR0b25cIil7XG4gICAgX2VsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dFxuICAgIHN0LmNvbG9yID0gY29sb3IuY29sb3JcbiAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5saWdodGdyYXlcbiAgICBzdC5ib3JkZXIgPSBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5XG4gICAgc3QuYm9yZGVyUmFkaXVzID0gXCIuMmVtXCJcbiAgICBzdC5wYWRkaW5nID0gXCIuMWVtIC40ZW1cIlxuICAgIHN0Lm1hcmdpbiA9IFwiLjJlbVwiXG4gIH1cbiAgaWYgKGFyZ3MpIE9iamVjdC5lbnRyaWVzKGFyZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSk9PntcbiAgICBpZiAoa2V5ID09PSAncGFyZW50Jyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnQpLmFwcGVuZENoaWxkKF9lbGVtZW50KVxuICAgIH1cbiAgICBpZiAoa2V5PT09J2NoaWxkcmVuJyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnRbXSkuZm9yRWFjaChjPT5fZWxlbWVudC5hcHBlbmRDaGlsZChjKSlcbiAgICB9ZWxzZSBpZiAoa2V5PT09J2V2ZW50TGlzdGVuZXJzJyl7XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCAoZTpFdmVudCk9PnZvaWQ+KS5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSk9PntcbiAgICAgICAgX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgICB9KVxuICAgIH1lbHNlIGlmIChrZXkgPT09ICdzdHlsZScpe1xuICAgICAgT2JqZWN0LmFzc2lnbihfZWxlbWVudC5zdHlsZSwgdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilcbiAgICB9ZWxzZXtcbiAgICAgIF9lbGVtZW50WyhrZXkgYXMgJ2lubmVyVGV4dCcgfCAnb25jbGljaycgfCAnb25pbnB1dCcgfCAnaWQnIHwgJ2NvbnRlbnRFZGl0YWJsZScpXSA9IHZhbHVlXG4gICAgfVxuICB9KVxuICByZXR1cm4gX2VsZW1lbnRcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEFyZyA9IHN0cmluZyB8IG51bWJlciB8IEhUTUxFbGVtZW50IHwgUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gIHwgUHJvbWlzZTxIVE1MQXJnPiB8IEhUTUxBcmdbXSB8IEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgaHRtbCA9ICh0YWc6c3RyaW5nLCAuLi5jczpIVE1MQXJnW10pOkhUTUxFbGVtZW50PT57XG4gIGxldCBjaGlsZHJlbjogSFRNTEVsZW1lbnRbXSA9IFtdXG4gIGxldCBhcmdzOiBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiA9IHt9XG5cbiAgY29uc3QgYWRkX2FyZyA9IChhcmc6SFRNTEFyZyk9PntcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZykpXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZy50b1N0cmluZygpKSlcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBQcm9taXNlKXtcbiAgICAgIGNvbnN0IGVsID0gc3BhbihcIi4uLlwiKVxuICAgICAgYXJnLnRoZW4oKHZhbHVlKT0+e1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4odmFsdWUpKVxuICAgICAgfSlcbiAgICAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgfVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBjaGlsZHJlbi5wdXNoKGFyZylcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIGFyZy5mb3JFYWNoKHg9PmFkZF9hcmcoeCkpXG4gICAgLy8gZWxzZSBpZiAoJ2dldCcgaW4gYXJnICYmIHR5cGVvZiBhcmcuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gICBjb25zdCBlbCA9IHNwYW4oKVxuICAgIC8vICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICAvLyAgIGlmICgnb251cGRhdGUnIGluIGFyZyAmJiB0eXBlb2YgYXJnLm9udXBkYXRlID09PSAnZnVuY3Rpb24nKSBhcmcub251cGRhdGUoeD0+ZWwucmVwbGFjZUNoaWxkcmVuKHgpKVxuICAgIC8vIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09IFwiZnVuY3Rpb25cIil7XG4gICAgICBpZiAoYXJnLm5hbWUgPT0gXCJvbmlucHV0XCIpIGFyZ3Mub25pbnB1dCA9IGFyZ1xuICAgICAgZWxzZSBpZiAoYXJnLm5hbWUgPT0gXCJvbmNsaWNrXCIgfHwgYXJnLmxlbmd0aCA8IDIpIGFyZ3Mub25jbGljayA9IGFyZ1xuICAgICAgZWxzZSBjb25zb2xlLndhcm4oXCJGdW5jdGlvbiBhcmd1bWVudCB3aXRob3V0IG5hbWUgb3Igd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlciBpcyBpZ25vcmVkIGluIGh0bWwgZ2VuZXJhdG9yXCIpXG4gICAgfVxuICAgIGVsc2UgYXJncyA9IHsuLi5hcmdzLCAuLi5hcmd9XG4gIH1cbiAgY3MuZm9yRWFjaChhZGRfYXJnKVxuICByZXR1cm4gaHRtbEVsZW1lbnQodGFnLCBcIlwiLCB7Li4uYXJncywgY2hpbGRyZW59KVxufVxuXG5leHBvcnQgdHlwZSBIVE1MR2VuZXJhdG9yPFQgZXh0ZW5kcyBIVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50PiA9ICguLi5jczpIVE1MQXJnW10pID0+IFRcbmNvbnN0IG5ld0h0bWxHZW5lcmF0b3IgPSA8VCBleHRlbmRzIEhUTUxFbGVtZW50Pih0YWc6c3RyaW5nKT0+KC4uLmNzOkhUTUxBcmdbXSk6VD0+aHRtbCh0YWcsIC4uLmNzKSBhcyBUXG5cbmV4cG9ydCBjb25zdCBwOkhUTUxHZW5lcmF0b3I8SFRNTFBhcmFncmFwaEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInBcIilcbmV4cG9ydCBjb25zdCBhOkhUTUxHZW5lcmF0b3I8SFRNTEFuY2hvckVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImFcIilcbmV4cG9ydCBjb25zdCBoMTpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDFcIilcbmV4cG9ydCBjb25zdCBoMjpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDJcIilcbmV4cG9ydCBjb25zdCBoMzpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDNcIilcbmV4cG9ydCBjb25zdCBoNDpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDRcIilcblxuZXhwb3J0IGNvbnN0IGRpdjpIVE1MR2VuZXJhdG9yPEhUTUxEaXZFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJkaXZcIilcbmV4cG9ydCBjb25zdCBwcmU6SFRNTEdlbmVyYXRvcjxIVE1MUHJlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicHJlXCIpXG5leHBvcnQgY29uc3Qgc3BhbjpIVE1MR2VuZXJhdG9yPEhUTUxTcGFuRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwic3BhblwiKVxuZXhwb3J0IGNvbnN0IHRleHRhcmVhOkhUTUxHZW5lcmF0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGV4dGFyZWFcIilcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbjpIVE1MR2VuZXJhdG9yPEhUTUxCdXR0b25FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJidXR0b25cIilcbi8vIGV4cG9ydCBjb25zdCB0YWJsZSA9IChyb3dzOiBIVE1MQXJnW11bXSwgLi4uYXJnczogSFRNTEFyZ1tdKSA9PiBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIikoIHN0eWxlKHtib3JkZXJTcGFjaW5nOiBcIjFlbSAuNGVtXCJ9KSAsIHJvd3MubWFwKGNlbGxzPT50cihjZWxscy5tYXAoY2VsbD0+dGQoY2VsbCkpKSksIC4uLmFyZ3MpXG5leHBvcnQgY29uc3QgdGFibGU6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKVxuXG5leHBvcnQgY29uc3QgdHI6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVSb3dFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0clwiKVxuZXhwb3J0IGNvbnN0IHRkOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRkXCIpXG5leHBvcnQgY29uc3QgdGg6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGhcIilcbmV4cG9ydCBjb25zdCBjYW52YXM6SFRNTEdlbmVyYXRvcjxIVE1MQ2FudmFzRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiY2FudmFzXCIpXG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9ICguLi5ydWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdKSA9PiAoe3N0eWxlOiBPYmplY3QuYXNzaWduKHt9LCAuLi5ydWxlcyl9KVxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7bWFyZ2luOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgcGFkZGluZyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7cGFkZGluZzogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlciA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyUmFkaXVzID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXJSYWRpdXM6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCB3aWR0aCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7d2lkdGg6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBoZWlnaHQgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2hlaWdodDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGRpc3BsYXkgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2Rpc3BsYXk6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kID0gKHZhbHVlOiBzdHJpbmcgPSBcInZhcigtLWJhY2tncm91bmQpXCIpID0+IHN0eWxlKHtiYWNrZ3JvdW5kOiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBpbnB1dDpIVE1MR2VuZXJhdG9yPEhUTUxJbnB1dEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBjb250ZW50ID0gY3MuZmlsdGVyKGM9PnR5cGVvZiBjID09ICdzdHJpbmcnKS5qb2luKCcgJylcbiAgY29uc3QgZWwgPSBodG1sKFwiaW5wdXRcIiwgLi4uY3MpIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgZWwudmFsdWUgPSBjb250ZW50XG4gIHJldHVybiBlbFxufVxuXG5leHBvcnQgY29uc3Qgc2VsZWN0OkhUTUxHZW5lcmF0b3I8SFRNTFNlbGVjdEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBlbCA9IGh0bWwoXCJzZWxlY3RcIiwgLi4uY3MpIGFzIEhUTUxTZWxlY3RFbGVtZW50XG4gIGNzLmZpbHRlcihjPT50eXBlb2YgYyA9PSAnc3RyaW5nJykuZm9yRWFjaChjPT5lbC5vcHRpb25zLmFkZChuZXcgT3B0aW9uKGMgYXMgc3RyaW5nLCBjIGFzIHN0cmluZykpKVxuICBcbiAgcmV0dXJuIGVsXG59XG5cbmV4cG9ydCBjb25zdCBwb3B1cCA9ICguLi5jczpIVE1MQXJnW10pPT57XG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KHtcbiAgICBzdHlsZToge1xuICAgICAgYmFja2dyb3VuZDogY29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiBjb2xvci5jb2xvcixcbiAgICAgIHBhZGRpbmc6IFwiMWVtIDRlbVwiLFxuICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICBtaW5XaWR0aDogXCIyMHZ3XCIsXG4gICAgICBtYXhIZWlnaHQ6IFwiODB2aFwiLFxuICAgIH19LFxuICAgIC4uLmNzKVxuXG4gIGNvbnN0IHBvcHVwYmFja2dyb3VuZCA9IGRpdihcbiAgICB7c3R5bGU6e1xuICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgIHRvcDogXCIwXCIsXG4gICAgICBsZWZ0OiBcIjBcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMTY2LCAxNjYsIDE2NiwgMC41KVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgIH19XG4gIClcblxuICBwb3B1cGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoZGlhbG9nZmllbGQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcHVwYmFja2dyb3VuZCk7XG4gIHBvcHVwYmFja2dyb3VuZC5vbmNsaWNrID0gKCkgPT4ge3BvcHVwYmFja2dyb3VuZC5yZW1vdmUoKTsgfVxuICBkaWFsb2dmaWVsZC5vbmNsaWNrID0gKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5leHBvcnQgY29uc3QgZXJyb3Jwb3B1cCA9IChlOkVycm9yIHwgc3RyaW5nKSA9PntcbiAgcG9wdXAoZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6Y29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjpcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgcGFkZGluZzpcIjFlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOlwiLjRlbVwiLFxuICAgICAgY29sb3I6Y29sb3IucmVkLFxuICAgIH0pLFxuICAgIGgyKFwiRXJyb3JcIiksXG4gICAgcChTdHJpbmcoZSkpXG4gICkpXG4gIHRocm93IChlIGluc3RhbmNlb2YgRXJyb3IpID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbExpc3QoaXRlbXM6IHt0aXRsZTogSFRNTEFyZywgY29udGVudDogSFRNTEFyZ31bXSl7XG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgZ2FwOiBcIjFlbVwiLFxuICAgIH0pLFxuICAgIC4uLml0ZW1zLm1hcChmPT5kaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi40ZW1cIixcbiAgICAgICAgcGFkZGluZzogXCIuNWVtIDFlbVwiLFxuICAgICAgfSksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi50aXRsZVxuICAgICAgKSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLmNvbnRlbnRcbiAgICAgIClcbiAgICApKVxuICApXG59XG5cblxuXG5cbiIsCiAgICAiXG5pbXBvcnQgdHlwZSB7IE1vZHVsZSwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuLy8gaW1wb3J0IHsgZmluZFBhdGggfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgZGl2LCBwLCBzdHlsZSB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzIH0gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IGdlcm1hbnlPdXRsaW5lIGZyb20gXCIuL2dlcm1hbnlfb3V0bGluZS5qc29uXCI7XG5cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiwgeDogbnVtYmVyLCB5OiBudW1iZXIpIDoge2VsOiBTVkdDaXJjbGVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJsaW5lXCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIpIDoge2VsOiBTVkdMaW5lRWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwidGV4dFwiLCB4OiBudW1iZXIsIHk6IG51bWJlciwgczogc3RyaW5nKSA6IHtlbDogU1ZHVGV4dEVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwiY2lyY2xlXCIgfCBcImxpbmVcIiB8IFwidGV4dFwiLCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4Mj86IG51bWJlciB8IHN0cmluZywgeTI/OiBudW1iZXIpe1xuICBsZXQgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCB0YWcpXG4gIGlmICh0YWcgPT0gXCJjaXJjbGVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiY3hcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjAxXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4ge1xuICAgICAgZWwsXG4gICAgICBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcImxpbmVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDFcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5MVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcIngyXCIsIHgyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkyXCIsIHkyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZVwiLCBcImdyYXlcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAwNVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIGNvbG9yKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICh0YWcgPT0gXCJ0ZXh0XCIpe1xuICAgIGVsLnNldEF0dHJpYnV0ZShcInhcIix4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInlcIiwgeTEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgZWwudGV4dENvbnRlbnQgPSBTdHJpbmcoeDIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiLjA3XCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcblxuICAgIHJldHVybiB7IGVsLCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57IGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpIH0gfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgdGFnXCIpXG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gbWFwVmlldyAoIG1vZDogTW9kdWxlICkgOiBIVE1MRWxlbWVudCB7XG5cbiAgbGV0IHtyb2FkbWFwLCBNQVBTSVpFfSA9IG1vZFxuICBjb25zdCByZWFsTWFwID0gXCJEdXJhdGlvbk1hdHJpeFwiIGluIHJvYWRtYXBcbiAgY29uc3QgeHMgPSByb2FkbWFwLnBvaW50cy5tYXAocG9pbnQgPT4gcG9pbnQueClcbiAgY29uc3QgeXMgPSByb2FkbWFwLnBvaW50cy5tYXAocG9pbnQgPT4gcG9pbnQueSlcbiAgY29uc3QgbWluWCA9IHJlYWxNYXAgPyA1LjUgOiAwXG4gIGNvbnN0IG1heFggPSByZWFsTWFwID8gMTUuNSA6IE1BUFNJWkVcbiAgY29uc3QgbWluWSA9IHJlYWxNYXAgPyA0Ny4yIDogMFxuICBjb25zdCBtYXhZID0gcmVhbE1hcCA/IDU1LjEgOiBNQVBTSVpFXG4gIC8vIEF0IEdlcm1hbnkncyBsYXRpdHVkZSwgb25lIGRlZ3JlZSBvZiBsb25naXR1ZGUgaXMgb25seSBhYm91dCA2MyUgb2Ygb25lIGRlZ3JlZVxuICAvLyBvZiBsYXRpdHVkZS4gS2VlcCB0aGF0IGdlb2dyYXBoaWMgYXNwZWN0IHJhdGlvIGluc3RlYWQgb2Ygc3RyZXRjaGluZyBib3RoIGF4ZXMuXG4gIGNvbnN0IHByb2plY3RYID0gKHg6IG51bWJlcikgPT4gcmVhbE1hcFxuICAgID8gLjEzNSArIC43MyAqICh4IC0gbWluWCkgLyBNYXRoLm1heChtYXhYIC0gbWluWCwgMWUtOSlcbiAgICA6IHggLyBNQVBTSVpFXG4gIGNvbnN0IHByb2plY3RZID0gKHk6IG51bWJlcikgPT4gcmVhbE1hcFxuICAgID8gLjk2IC0gLjkyICogKHkgLSBtaW5ZKSAvIE1hdGgubWF4KG1heFkgLSBtaW5ZLCAxZS05KVxuICAgIDogeSAvIE1BUFNJWkVcblxuXG5cbiAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKVxuXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCI4MCVcIilcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCI4MCVcIilcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiMCAwIDEgMVwiKVxuXG4gIGxldCBlbGVtZW50cyA9IG5ldyBNYXA8YW55LCBTVkdFbGVtZW50PigpXG4gIGxldCBzb3VyY2VzID0gbmV3IE1hcDxTVkdFbGVtZW50LCBhbnk+KClcblxuICBpZiAocmVhbE1hcCkge1xuICAgIGNvbnN0IG91dGxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInBhdGhcIilcbiAgICBvdXRsaW5lLnNldEF0dHJpYnV0ZShcImRcIiwgZ2VybWFueU91dGxpbmUubWFwKHBvbHlnb24gPT5cbiAgICAgIHBvbHlnb24ubWFwKHJpbmcgPT4gcmluZy5tYXAoKFtsb24sIGxhdF0sIGluZGV4KSA9PlxuICAgICAgICBgJHtpbmRleCA9PT0gMCA/IFwiTVwiIDogXCJMXCJ9JHtwcm9qZWN0WChsb24hKX0gJHtwcm9qZWN0WShsYXQhKX1gXG4gICAgICApLmpvaW4oXCIgXCIpICsgXCIgWlwiKS5qb2luKFwiIFwiKVxuICAgICkuam9pbihcIiBcIikpXG4gICAgb3V0bGluZS5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiI2YxZjRmMFwiKVxuICAgIG91dGxpbmUuc2V0QXR0cmlidXRlKFwiZmlsbC1ydWxlXCIsIFwiZXZlbm9kZFwiKVxuICAgIG91dGxpbmUuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiIzgyOTA4N1wiKVxuICAgIG91dGxpbmUuc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiMC4wMDNcIilcbiAgICBvdXRsaW5lLnNldEF0dHJpYnV0ZShcInZlY3Rvci1lZmZlY3RcIiwgXCJub24tc2NhbGluZy1zdHJva2VcIilcbiAgICBvdXRsaW5lLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIlxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob3V0bGluZSlcbiAgfVxuICBcbiAgLy8gQSByZWFsIHJvYWRtYXAncyBtYXRyaXggaXMgY29tcGxldGUsIHNvIGRyYXdpbmcgZXZlcnkgbWF0cml4IHBhaXIgd291bGQgY3JlYXRlXG4gIC8vIHRlbnMgb2YgdGhvdXNhbmRzIG9mIGxpbmVzLiBTeW50aGV0aWMgbWFwcyBzdGlsbCBzaG93IHRoZWlyIGdlbmVyYXRlZCByb2Fkcy5cbiAgZm9yIChsZXQgeCA9MCA7ICFyZWFsTWFwICYmIHggPCByb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgZm9yIChsZXQgeSA9IDA7IHk8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeSsrKXtcbiAgICAgIGlmICh4ID09IHkpIGNvbnRpbnVlXG4gICAgICBsZXQgbGVuID0gcm9hZG1hcC5nZXRyb2FkKHgseSlcbiAgICAgIGlmIChsZW4gPT0gMCB8fCBsZW4gPT0gdW5kZWZpbmVkKSBjb250aW51ZSAgXG5cblxuICAgICAgbGV0IGEgPSByb2FkbWFwLnBvaW50c1t4XSFcbiAgICAgIGxldCBiID0gcm9hZG1hcC5wb2ludHNbeV0hXG4gICAgICBsZXQgbGluZSA9IG1rU3ZnKFwibGluZVwiLCBwcm9qZWN0WChhLngpLCBwcm9qZWN0WShhLnkpLCBwcm9qZWN0WChiLngpLCBwcm9qZWN0WShiLnkpKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBwcm9qZWN0WChsb2MueCksIHByb2plY3RZKGxvYy55KSkuZWxcbiAgICBpZiAocmVhbE1hcCkgY2lyY2xlLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjAwNFwiKVxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cbiAgbGV0IGhpZ2hsaWdodFZlcnNpb24gPSAwXG4gIGNvbnN0IGdlb21ldHJ5Q2FjaGUgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxudW1iZXJbXVtdIHwgbnVsbD4+KClcblxuICBmdW5jdGlvbiByb3V0ZUdlb21ldHJ5KGZyb206IG51bWJlciwgdG86IG51bWJlcikge1xuICAgIGNvbnN0IGEgPSBNYXRoLm1pbihmcm9tLCB0byksIGIgPSBNYXRoLm1heChmcm9tLCB0bylcbiAgICBjb25zdCBrZXkgPSBgJHthfS0ke2J9YFxuICAgIGxldCBnZW9tZXRyeSA9IGdlb21ldHJ5Q2FjaGUuZ2V0KGtleSlcbiAgICBpZiAoIWdlb21ldHJ5KSB7XG4gICAgICBnZW9tZXRyeSA9IGZldGNoKGAuL3JvdXRlLWdlb21ldHJ5P2Zyb209JHthfSZ0bz0ke2J9YClcbiAgICAgICAgLnRoZW4oYXN5bmMgcmVzcG9uc2UgPT4gcmVzcG9uc2Uub2sgPyAoYXdhaXQgcmVzcG9uc2UuanNvbigpIGFzIHtjb29yZGluYXRlczogbnVtYmVyW11bXX0pLmNvb3JkaW5hdGVzIDogbnVsbClcbiAgICAgICAgLmNhdGNoKCgpID0+IG51bGwpXG4gICAgICBnZW9tZXRyeUNhY2hlLnNldChrZXksIGdlb21ldHJ5KVxuICAgIH1cbiAgICByZXR1cm4gZ2VvbWV0cnkudGhlbihjb29yZGluYXRlcyA9PiBjb29yZGluYXRlcyAmJiBmcm9tID4gdG8gPyBbLi4uY29vcmRpbmF0ZXNdLnJldmVyc2UoKSA6IGNvb3JkaW5hdGVzKVxuICB9XG5cbiAgZnVuY3Rpb24gcm91dGVQYXRoKGNvb3JkaW5hdGVzOiBudW1iZXJbXVtdLCBjb2xvcjogc3RyaW5nKSB7XG4gICAgY29uc3QgcGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicGF0aFwiKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwiZFwiLCBjb29yZGluYXRlcy5tYXAoKFtsb24sIGxhdF0sIGluZGV4KSA9PlxuICAgICAgYCR7aW5kZXggPT09IDAgPyBcIk1cIiA6IFwiTFwifSR7cHJvamVjdFgobG9uISl9ICR7cHJvamVjdFkobGF0ISl9YFxuICAgICkuam9pbihcIiBcIikpXG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIGNvbG9yKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiLjAwNlwiKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwic3Ryb2tlLWxpbmVjYXBcIiwgXCJyb3VuZFwiKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwic3Ryb2tlLWxpbmVqb2luXCIsIFwicm91bmRcIilcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKHBhdGgpXG4gICAgcmV0dXJuIHsgcmVtb3ZlOiAoKSA9PiBwYXRoLnJlbW92ZSgpIH1cbiAgfVxuXG4gIGhpZ2h0TGlnaHRzLm9udXBkYXRlKChuSCxvKT0+e1xuICAgIGNvbnN0IHZlcnNpb24gPSArK2hpZ2hsaWdodFZlcnNpb25cbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBoaW50cyA9IFtdXG4gICAgZm9yIChsZXQgbiBvZiBuSCl7XG4gICAgICBsZXQgbGFzdCA6IG51bWJlciB8IG51bGwgPSBudWxsXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgbGV0IG5leHQgPSBwLm51bWJlclxuICAgICAgICBpZiAobGFzdCAhPT0gbnVsbCl7XG4gICAgICAgICAgbGV0IEEgPSByb2FkbWFwLnBvaW50c1tsYXN0XSFcbiAgICAgICAgICBsZXQgQiA9IHJvYWRtYXAucG9pbnRzW25leHRdIVxuICAgICAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIHByb2plY3RYKEEueCksIHByb2plY3RZKEEueSksIHByb2plY3RYKEIueCksIHByb2plY3RZKEIueSkpXG4gICAgICAgICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIGxpbmUuZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiMC4wMVwiKVxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICBjb25zdCBmYWxsYmFjayA9IHtyZW1vdmU6ICgpPT5saW5lLmVsLnJlbW92ZSgpfVxuICAgICAgICAgIGhpbnRzLnB1c2goZmFsbGJhY2spXG4gICAgICAgICAgaWYgKHJlYWxNYXAgJiYgbGFzdCAhPT0gbmV4dCkge1xuICAgICAgICAgICAgdm9pZCByb3V0ZUdlb21ldHJ5KGxhc3QsIG5leHQpLnRoZW4oY29vcmRpbmF0ZXMgPT4ge1xuICAgICAgICAgICAgICBpZiAodmVyc2lvbiAhPT0gaGlnaGxpZ2h0VmVyc2lvbiB8fCAhY29vcmRpbmF0ZXMpIHJldHVyblxuICAgICAgICAgICAgICBmYWxsYmFjay5yZW1vdmUoKVxuICAgICAgICAgICAgICBoaW50cyA9IGhpbnRzLmZpbHRlcihoaW50ID0+IGhpbnQgIT09IGZhbGxiYWNrKVxuICAgICAgICAgICAgICBoaW50cy5wdXNoKHJvdXRlUGF0aChjb29yZGluYXRlcywgbi5jb2xvciA/PyBcIiNmZmM5ODhcIikpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHByb2plY3RYKHBvcy54KSwgcHJvamVjdFkocG9zLnkpLCBwLmxvZ28pXG4gICAgICAgICAgaWYgKHJlYWxNYXApIGVsLmVsLnNldEF0dHJpYnV0ZShcImZvbnQtc2l6ZVwiLCBcIi4wMzVcIilcbiAgICAgICAgICBlbC5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwMFwiKVxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZWwuZWwpXG4gICAgICAgICAgaGludHMucHVzaChlbC5lbClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICBsZXQgZHYgPSBkaXYoc3R5bGUoe3dpZHRoOlwiMTAwJVwiLCBkaXNwbGF5OlwiZmxleFwiLCBqdXN0aWZ5Q29udGVudDpcImNlbnRlclwiLCBwYWRkaW5nOiBcIjFlbVwifSkpXG4gIGR2LmFwcGVuZChlbGVtZW50KVxuXG5cbiAgcmV0dXJuIGR2XG59XG4iLAogICAgIlxuXG5cbmxldCBSQU5EU0VFRCA9IDBcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFJhbmRTZWVkKHNlZWQ6IG51bWJlcil7XG4gIFJBTkRTRUVEID0gc2VlZFxuICBSQU5EU0VFRCA9IHJhbmRJbnQoMCwgMTAwMDApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBvcnRTdGF0ZSAoKSB7cmV0dXJuIFJBTkRTRUVEfVxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRTdGF0ZSAoc2VlZDogbnVtYmVyKSB7UkFORFNFRUQgPSBzZWVkfVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tKCl7XG4gIGxldCB4ID0gTWF0aC5zaW4oUkFORFNFRUQrKykgKiAxMDAwMDtcbiAgcmV0dXJuIHggLSBNYXRoLmZsb29yKHgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZEludChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpe1xuICByZXR1cm4gTWF0aC5mbG9vcihyYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pblxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZENob2ljZTxUPihhcnI6IFRbXSk6IFQge1xuICByZXR1cm4gYXJyW3JhbmRJbnQoMCwgYXJyLmxlbmd0aCldIVxufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuL3JhbmRvbVwiO1xuXG5leHBvcnQgdHlwZSBQb3MgPSB7eDpudW1iZXIsIHk6IG51bWJlcn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tTWFwIChOUE9JTlRTOm51bWJlciwgTUFQU0laRTpudW1iZXIpe1xuXG4gIGxldCBIUE9JTlQgPSBOUE9JTlRTLzJcbiAgbGV0IFJTSVpFID0gTlBPSU5UUyAqIEhQT0lOVFxuXG5cbiAgbGV0IHJvYWRzID0gbmV3IFVpbnQxNkFycmF5KFJTSVpFKVxuXG4gIGZ1bmN0aW9uIHJvYWRJRFggIChhOm51bWJlciwgYjpudW1iZXIpe1xuICAgIGlmIChhPGIpIFthLGJdID0gW2IsYV1cbiAgICBsZXQgaWR4ID0gYSArIE5QT0lOVFMgKiBiXG4gICAgaWYgKGlkeD5SU0laRSkgaWR4ID0gTlBPSU5UUyoqMiAtIGlkeFxuXG4gICAgcmV0dXJuIGlkeCBcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyKSB7XG4gICAgaWYgKGE9PWIpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBnZXQgcm9hZCBmcm9tIGEgcG9pbnQgdG8gaXRzZWxmXCIpXG4gICAgcmV0dXJuIHJvYWRzW3JvYWRJRFgoYSxiKV0hXG4gIH1cblxuICBmdW5jdGlvbiBzZXRyb2FkIChhOiBudW1iZXIsIGI6IG51bWJlciwgZGlzdDogbnVtYmVyKSB7XG4gICAgaWYgKGE9PWIpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBzZXQgcm9hZCBmcm9tIGEgcG9pbnQgdG8gaXRzZWxmXCIpXG4gICAgcm9hZHNbcm9hZElEWChhLGIpXSA9IGRpc3RcbiAgfVxuXG4gIGxldCByYW5nZSA9IEFycmF5LmZyb20oe2xlbmd0aDogTlBPSU5UU30sIChfLGkpPT4gaSlcbiAgbGV0IHBvaW50cyA6IFBvc1tdID0gcmFuZ2UubWFwKCgpPT4oe3g6IHJhbmRJbnQoMCxNQVBTSVpFKSwgeTogcmFuZEludCgwLE1BUFNJWkUpfSkpXG4gIGxldCBuZWlnaHMgPSBwb2ludHMubWFwKChwcyxpKT0+XG4gICAgcG9pbnRzLm1hcCgocDIsIGkyKT0+ICAoe2Q6IE1hdGguZmxvb3IoTWF0aC5oeXBvdChwcy54IC0gcDIueCwgcHMueSAtIHAyLnkpKSwgaTogaTJ9KSlcbiAgICAuZmlsdGVyKHggPT4geC5pICE9IGkpIC5zb3J0KChhLGIpPT4gYS5kIC0gYi5kKSApXG5cbiAgZnVuY3Rpb24gY29ubmVjdChhOiBudW1iZXIsIGI6IG51bWJlciwgZGlzdDogbnVtYmVyKXtcbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuXG4gICAgaWYgKGdldHJvYWQoYSwgYikgIT09IDApIHJldHVyblxuICAgIHNldHJvYWQoYSwgYiwgZGlzdClcbiAgfVxuXG4gIC8vIEJ1aWxkIGEgY29ubmVjdGVkIGJhY2tib25lIGJ5IHJlcGVhdGVkbHkgYXR0YWNoaW5nIHRoZSBuZWFyZXN0IHVuY29ubmVjdGVkIHBvaW50LlxuICBjb25zdCBjb25uZWN0ZWQgPSBuZXcgU2V0PG51bWJlcj4oWzBdKVxuICB3aGlsZSAoY29ubmVjdGVkLnNpemUgPCBOUE9JTlRTKXtcbiAgICBsZXQgYmVzdEEgPSAtMVxuICAgIGxldCBiZXN0QiA9IC0xXG4gICAgbGV0IGJlc3REID0gSW5maW5pdHlcblxuICAgIGZvciAoY29uc3QgYSBvZiBjb25uZWN0ZWQpe1xuICAgICAgZm9yIChjb25zdCBuZWkgb2YgbmVpZ2hzW2FdID8/IFtdKXtcbiAgICAgICAgaWYgKGNvbm5lY3RlZC5oYXMobmVpLmkpKSBjb250aW51ZVxuICAgICAgICBpZiAobmVpLmQgPCBiZXN0RCl7XG4gICAgICAgICAgYmVzdEEgPSBhXG4gICAgICAgICAgYmVzdEIgPSBuZWkuaVxuICAgICAgICAgIGJlc3REID0gbmVpLmRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChiZXN0QSA9PT0gLTEgfHwgYmVzdEIgPT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gY29ubmVjdCByYW5kb20gbWFwXCIpXG4gICAgY29ubmVjdChiZXN0QSwgYmVzdEIsIGJlc3REKVxuICAgIGNvbm5lY3RlZC5hZGQoYmVzdEIpXG4gIH1cblxuICAvLyBBZGQgYSBmZXcgZXh0cmEgbG9jYWwgcm9hZHMgc28gdGhlIG1hcCBpcyBub3QganVzdCBhIHRyZWUuXG4gIGZvciAobGV0IHggPSAwOyB4IDwgTlBPSU5UUzsgeCsrKXtcbiAgICBjb25zdCBleHRyYUVkZ2VzID0gMiArIHJhbmRJbnQoMCwgMylcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4dHJhRWRnZXM7IGkrKyl7XG4gICAgICBjb25zdCBueCA9IG5laWdoc1t4XT8uW2ldXG4gICAgICBpZiAoIW54KSBjb250aW51ZVxuICAgICAgY29ubmVjdCh4LCBueC5pLCBueC5kKVxuICAgIH1cbiAgfVxuXG5cblxuXG4gIGNvbnN0IENvc3RNYXRyaXggPSBuZXcgVWludDMyQXJyYXkoUlNJWkUpO1xuXG4gIHtcbiAgXG4gICAgY29uc3QgcG9pbnRDb3VudCA9IHBvaW50cy5sZW5ndGg7XG4gICAgY29uc3QgSU5GID0gMHhmZmZmO1xuICBcbiAgICBDb3N0TWF0cml4LmZpbGwoSU5GKTtcbiAgXG4gICAgZm9yIChsZXQgc3RhcnQgPSAwOyBzdGFydCA8IHBvaW50Q291bnQ7IHN0YXJ0KyspIHtcbiAgICAgIGNvbnN0IGRpc3QgPSBuZXcgVWludDMyQXJyYXkocG9pbnRDb3VudCk7XG4gICAgICBjb25zdCB2aXNpdGVkID0gbmV3IFVpbnQ4QXJyYXkocG9pbnRDb3VudCk7XG4gICAgICBkaXN0LmZpbGwoSU5GKTtcbiAgICAgIGRpc3Rbc3RhcnRdID0gMDtcbiAgXG4gICAgICBmb3IgKGxldCBzdGVwID0gMDsgc3RlcCA8IHBvaW50Q291bnQ7IHN0ZXArKykge1xuICAgICAgICBsZXQgY3VycmVudCA9IC0xO1xuICAgICAgICBsZXQgYmVzdCA9IElORjtcbiAgXG4gICAgICAgIGZvciAobGV0IG5vZGUgPSAwOyBub2RlIDwgcG9pbnRDb3VudDsgbm9kZSsrKSB7XG4gICAgICAgICAgaWYgKHZpc2l0ZWRbbm9kZV0gPT09IDAgJiYgZGlzdFtub2RlXSEgPCBiZXN0KSB7XG4gICAgICAgICAgICBiZXN0ID0gZGlzdFtub2RlXSE7XG4gICAgICAgICAgICBjdXJyZW50ID0gbm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgXG4gICAgICAgIGlmIChjdXJyZW50ID09PSAtMSkgYnJlYWs7XG4gICAgICAgIHZpc2l0ZWRbY3VycmVudF0gPSAxO1xuICBcbiAgICAgICAgZm9yIChsZXQgbmV4dCA9IDA7IG5leHQgPCBwb2ludENvdW50OyBuZXh0KyspIHtcbiAgICAgICAgICBpZiAobmV4dCA9PT0gY3VycmVudCkgY29udGludWU7XG4gICAgICAgICAgY29uc3Qgcm9hZCA9IGdldHJvYWQoY3VycmVudCwgbmV4dCk7XG4gICAgICAgICAgaWYgKHJvYWQgPT09IDApIGNvbnRpbnVlO1xuICAgICAgICAgIGNvbnN0IG5leHRDb3N0ID0gZGlzdFtjdXJyZW50XSEgKyByb2FkO1xuICAgICAgICAgIGlmIChuZXh0Q29zdCA8IGRpc3RbbmV4dF0hKSB7XG4gICAgICAgICAgICBkaXN0W25leHRdID0gbmV4dENvc3Q7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gIFxuICAgICAgZm9yIChsZXQgZW5kID0gMDsgZW5kIDwgcG9pbnRDb3VudDsgZW5kKyspIHtcbiAgICAgICAgaWYgKGVuZCA9PT0gc3RhcnQpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBpZHggPSByb2FkSURYKHN0YXJ0LCBlbmQpO1xuICAgICAgICBDb3N0TWF0cml4W2lkeF0gPSBNYXRoLm1pbihkaXN0W2VuZF0hLCBJTkYpO1xuICAgICAgfVxuICAgIH1cbiAgXG4gIH1cblxuXG5cbiAgZnVuY3Rpb24gZmluZFBhdGgoc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpOm51bWJlcltdIHtcblxuICAgIGxldCBwYXRoIDogbnVtYmVyW10gPSBbc3RhcnRdXG4gICAgbGV0IGNvc3QgPSBDb3N0TWF0cml4W3JvYWRJRFgoc3RhcnQsZW5kKV1cbiAgICB3aGlsZSAoc3RhcnQgIT0gZW5kKXtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgcG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICAgICAgaWYgKHggPT0gc3RhcnQpIGNvbnRpbnVlXG4gICAgICAgIGxldCByb2FkID0gZ2V0cm9hZChzdGFydCx4KVxuICAgICAgICBpZiAocm9hZCA9PSAwKSBjb250aW51ZVxuICAgICAgICBsZXQgcmVzdGNvc3QgPSBDb3N0TWF0cml4W3JvYWRJRFgoeCxlbmQpXSFcbiAgICAgICAgaWYgKHJvYWQrIHJlc3Rjb3N0ID09IGNvc3Qpe1xuICAgICAgICAgIGNvc3QgPSByZXN0Y29zdFxuICAgICAgICAgIHN0YXJ0ID0geFxuICAgICAgICAgIHBhdGgucHVzaCh4KVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhdGhcbiAgfVxuICBcbiAgZnVuY3Rpb24gZ2V0Q29zdE4oLi4ucG9pbnRzOiBudW1iZXJbXSk6IG51bWJlciB7XG4gIFxuICAgIGxldCBjb3N0ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGlmIChwb2ludHNbaV0gIT09IHBvaW50c1tpICsgMV0pIGNvc3QgKz0gQ29zdE1hdHJpeFtyb2FkSURYKHBvaW50c1tpXSEsIHBvaW50c1tpICsgMV0hKV0hO1xuICAgIH1cbiAgICByZXR1cm4gY29zdDtcbiAgfVxuXG5cbiAgcmV0dXJuIHsgZ2V0cm9hZCwgcm9hZElEWCwgcG9pbnRzLCByYW5nZSwgQ29zdE1hdHJpeCwgZmluZFBhdGgsIGdldENvc3ROfVxufVxuXG5cbmV4cG9ydCB0eXBlIFJvYWRNYXAgPSB0eXBlb2YgcmFuZG9tTWFwIGV4dGVuZHMgKC4uLng6YW55KSA9PiAoaW5mZXIgVCkgPyBUIDogbmV2ZXJcbiIsCiAgICAidHlwZSBKc29uVmFsdWUgPVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCBudWxsXG4gIHwgeyBba2V5OiBzdHJpbmddOiBKc29uVmFsdWUgfVxuICB8IEpzb25WYWx1ZVtdXG5cbnR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cblxuY29uc3QgdHlwZU5hbWUgPSAodmFsdWU6IHVua25vd24pOiBzdHJpbmcgPT4ge1xuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBcIm51bGxcIlxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiBcImFycmF5XCJcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZVxufVxuXG5jb25zdCBwYXRoTGFiZWwgPSAocGF0aDogc3RyaW5nKTogc3RyaW5nID0+IHBhdGggfHwgXCIkXCJcblxuY29uc3QgZmFpbCA9IChwYXRoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyk6IG5ldmVyID0+IHtcbiAgdGhyb3cgbmV3IEVycm9yKGBWYWxpZGF0aW9uIGVycm9yIGF0ICR7cGF0aExhYmVsKHBhdGgpfTogJHttZXNzYWdlfWApXG59XG5cbmNvbnN0IGlzUGxhaW5PYmplY3QgPSAodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9PlxuICB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpXG5cbmNvbnN0IGRlZXBFcXVhbCA9IChsZWZ0OiB1bmtub3duLCByaWdodDogdW5rbm93bik6IGJvb2xlYW4gPT4ge1xuICBpZiAoT2JqZWN0LmlzKGxlZnQsIHJpZ2h0KSkgcmV0dXJuIHRydWVcbiAgaWYgKEFycmF5LmlzQXJyYXkobGVmdCkgJiYgQXJyYXkuaXNBcnJheShyaWdodCkpIHtcbiAgICByZXR1cm4gbGVmdC5sZW5ndGggPT09IHJpZ2h0Lmxlbmd0aCAmJiBsZWZ0LmV2ZXJ5KCh2YWx1ZSwgaW5kZXgpID0+IGRlZXBFcXVhbCh2YWx1ZSwgcmlnaHRbaW5kZXhdKSlcbiAgfVxuICBpZiAoaXNQbGFpbk9iamVjdChsZWZ0KSAmJiBpc1BsYWluT2JqZWN0KHJpZ2h0KSkge1xuICAgIGNvbnN0IGxlZnRLZXlzID0gT2JqZWN0LmtleXMobGVmdClcbiAgICBjb25zdCByaWdodEtleXMgPSBPYmplY3Qua2V5cyhyaWdodClcbiAgICByZXR1cm4gbGVmdEtleXMubGVuZ3RoID09PSByaWdodEtleXMubGVuZ3RoXG4gICAgICAmJiBsZWZ0S2V5cy5ldmVyeShrZXkgPT4ga2V5IGluIHJpZ2h0ICYmIGRlZXBFcXVhbChsZWZ0W2tleV0sIHJpZ2h0W2tleV0pKVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5jb25zdCBhcHBlbmRQYXRoID0gKHBhdGg6IHN0cmluZywgcGFydDogc3RyaW5nKTogc3RyaW5nID0+XG4gIHBhdGggPyBgJHtwYXRofSR7cGFydH1gIDogYCQke3BhcnR9YFxuXG5jb25zdCB2YWxpZGF0ZU9iamVjdCA9IChzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgb2JqZWN0LCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgY29uc3Qgb2JqZWN0VmFsdWUgPSB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuXG4gIGNvbnN0IHByb3BlcnRpZXMgPSBpc1BsYWluT2JqZWN0KHNjaGVtYS5wcm9wZXJ0aWVzKSA/IHNjaGVtYS5wcm9wZXJ0aWVzIDoge31cbiAgY29uc3QgcmVxdWlyZWQgPSBBcnJheS5pc0FycmF5KHNjaGVtYS5yZXF1aXJlZCkgPyBzY2hlbWEucmVxdWlyZWQgOiBbXVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIHJlcXVpcmVkKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgIT09IFwic3RyaW5nXCIpIGNvbnRpbnVlXG4gICAgaWYgKCEoa2V5IGluIG9iamVjdFZhbHVlKSkgZmFpbChhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCksIFwiaXMgcmVxdWlyZWRcIilcbiAgfVxuXG4gIGZvciAoY29uc3QgW2tleSwgcHJvcGVydHlTY2hlbWFdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BlcnRpZXMpKSB7XG4gICAgaWYgKCEoa2V5IGluIG9iamVjdFZhbHVlKSkgY29udGludWVcbiAgICBpZiAoIWlzUGxhaW5PYmplY3QocHJvcGVydHlTY2hlbWEpKSBjb250aW51ZVxuICAgIHZhbGlkYXRlSnNvblNjaGVtYShwcm9wZXJ0eVNjaGVtYSBhcyBKU09OU2NoZW1hLCBvYmplY3RWYWx1ZVtrZXldLCBhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCkpXG4gIH1cblxuICBjb25zdCBleHRyYUtleXMgPSBPYmplY3Qua2V5cyhvYmplY3RWYWx1ZSkuZmlsdGVyKGtleSA9PiAhKGtleSBpbiBwcm9wZXJ0aWVzKSlcbiAgY29uc3QgYWRkaXRpb25hbCA9IHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllc1xuICBpZiAoYWRkaXRpb25hbCA9PT0gZmFsc2UpIHtcbiAgICBpZiAoZXh0cmFLZXlzLmxlbmd0aCA+IDApIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7ZXh0cmFLZXlzWzBdfWApLCBcImFkZGl0aW9uYWwgcHJvcGVydGllcyBhcmUgbm90IGFsbG93ZWRcIilcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmIChpc1BsYWluT2JqZWN0KGFkZGl0aW9uYWwpKSB7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgZXh0cmFLZXlzKSB7XG4gICAgICB2YWxpZGF0ZUpzb25TY2hlbWEoYWRkaXRpb25hbCBhcyBKU09OU2NoZW1hLCBvYmplY3RWYWx1ZVtrZXldLCBhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCkpXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IHZhbGlkYXRlQXJyYXkgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIGFycmF5LCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgY29uc3QgYXJyYXlWYWx1ZSA9IHZhbHVlIGFzIHVua25vd25bXVxuICBpZiAoIWlzUGxhaW5PYmplY3Qoc2NoZW1hLml0ZW1zKSkgcmV0dXJuXG4gIGFycmF5VmFsdWUuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHZhbGlkYXRlSnNvblNjaGVtYShzY2hlbWEuaXRlbXMgYXMgSlNPTlNjaGVtYSwgaXRlbSwgYXBwZW5kUGF0aChwYXRoLCBgWyR7aW5kZXh9XWApKSlcbn1cblxuY29uc3QgdmFsaWRhdGVCeVR5cGUgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIHN3aXRjaCAoc2NoZW1hLnR5cGUpIHtcbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBzdHJpbmcsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIiB8fCBOdW1iZXIuaXNOYU4odmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudW1iZXIsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwiYm9vbGVhblwiKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBib29sZWFuLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudWxsXCI6XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG51bGwsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcImFycmF5XCI6XG4gICAgICB2YWxpZGF0ZUFycmF5KHNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICB2YWxpZGF0ZU9iamVjdChzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICByZXR1cm5cbiAgICBkZWZhdWx0OlxuICAgICAgZmFpbChwYXRoLCBgdW5zdXBwb3J0ZWQgc2NoZW1hIHR5cGUgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEudHlwZSl9YClcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGVKc29uU2NoZW1hID0gPFQ+KHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGggPSBcIlwiKTogVCA9PiB7XG4gIGlmIChcImNvbnN0XCIgaW4gc2NoZW1hICYmICFkZWVwRXF1YWwodmFsdWUsIHNjaGVtYS5jb25zdCkpIHtcbiAgICBmYWlsKHBhdGgsIGBleHBlY3RlZCBjb25zdGFudCAke0pTT04uc3RyaW5naWZ5KHNjaGVtYS5jb25zdCl9YClcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbnlPZikpIHtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW11cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBzY2hlbWEuYW55T2YpIHtcbiAgICAgIGlmICghaXNQbGFpbk9iamVjdChvcHRpb24pKSBjb250aW51ZVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICAgIGZhaWwocGF0aCwgZXJyb3JzWzBdID8/IFwiZGlkIG5vdCBtYXRjaCBhbnkgYWxsb3dlZCBzY2hlbWFcIilcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbGxPZikpIHtcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBzY2hlbWEuYWxsT2YpIHtcbiAgICAgIGlmICghaXNQbGFpbk9iamVjdChvcHRpb24pKSBjb250aW51ZVxuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKG9wdGlvbiBhcyBKU09OU2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICB9XG4gIH1cblxuICB2YWxpZGF0ZUJ5VHlwZShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICByZXR1cm4gdmFsdWUgYXMgVFxufVxuIiwKICAgICJpbXBvcnQgeyB2YWxpZGF0ZUpzb25TY2hlbWEgfSBmcm9tIFwiLi9qc29uc2NoZW1hXCJcblxuXG5leHBvcnQgdHlwZSBKU09OU2NoZW1hID0geyBba2V5OiBzdHJpbmddOiBKc29uRGF0YSB9XG5cblxuZXhwb3J0IHR5cGUgSnNvbkRhdGEgPSBzdHJpbmcgfCBudWxsIHwgbnVtYmVyIHwgYm9vbGVhbiB8IHsgW2tleSBpbiBzdHJpbmddOiBKc29uRGF0YSB9IHwgSnNvbkRhdGFbXVxuXG5leHBvcnQgdHlwZSBTY2hlbWE8VD4gPSB7IGpzb246IEpTT05TY2hlbWEgfVxuXG5leHBvcnQgdHlwZSBJbmZlcjxTPiA9IFMgZXh0ZW5kcyBTY2hlbWE8aW5mZXIgVD4gPyBUIDogbmV2ZXJcblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlID0gPFQ+IChzY2hlbWE6IFNjaGVtYTxUPiwgZGF0YTp1bmtub3duKSA6IFQgPT4ge1xuICByZXR1cm4gdmFsaWRhdGVKc29uU2NoZW1hPFQ+KHNjaGVtYS5qc29uLCBkYXRhKVxufVxuXG5leHBvcnQgY29uc3Qgc3RyaW5naWZ5ID0gKGRhdGE6IEpzb25EYXRhKTogc3RyaW5nID0+IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpXG5cblxuZXhwb3J0IGNvbnN0IGZpbGxTY2hlbWEgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogVCA9PntcbiAgbGV0IGpzb24gPSBzY2hlbWEuanNvblxuICBpZiAoanNvbi50eXBlID09IFwic3RyaW5nXCIpIHJldHVybiBcIlwiIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm51bWJlclwiKSByZXR1cm4gMCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBmYWxzZSBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudWxsXCIpIHJldHVybiBudWxsIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcImFycmF5XCIpIHJldHVybiBbXSBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBqc29uLnByb3BlcnRpZXMpe1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge31cbiAgICBsZXQgcmVxdWlyZWQgPSBBcnJheS5pc0FycmF5KGpzb24ucmVxdWlyZWQpID8ganNvbi5yZXF1aXJlZCBhcyBzdHJpbmdbXSA6IFtdXG4gICAgZm9yIChsZXQgcmVxIG9mIHJlcXVpcmVkKVxuICAgICAgcmVzdWx0W3JlcV0gPSBmaWxsU2NoZW1hKHtqc29uOiAoanNvbi5wcm9wZXJ0aWVzIGFzIGFueSlbcmVxXX0pXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGlmIChcImNvbnN0XCIgaW4ganNvbikgcmV0dXJuIGpzb24uY29uc3QgYXMgVFxuICBpZiAoXCJhbnlPZlwiIGluIGpzb24gJiYgQXJyYXkuaXNBcnJheShqc29uLmFueU9mKSkgcmV0dXJuIGZpbGxTY2hlbWEoe2pzb246IGpzb24uYW55T2ZbMF0gYXMgSlNPTlNjaGVtYX0pIGFzIFRcbiAgcmV0dXJuIG51bGwgYXMgVFxufVxuXG5leHBvcnQgY29uc3QgZnJvbUpzb25TY2hlbWEgPSA8VD4gKGpzb246IEpTT05TY2hlbWEpOiBTY2hlbWE8VD4gPT4gKHtqc29ufSlcblxuZXhwb3J0IGNvbnN0IHN0cmluZzogU2NoZW1hPHN0cmluZz4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJzdHJpbmdcIn0pXG5leHBvcnQgY29uc3QgbnVtYmVyOiBTY2hlbWE8bnVtYmVyPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm51bWJlclwifSlcbmV4cG9ydCBjb25zdCBib29sZWFuOiBTY2hlbWE8Ym9vbGVhbj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJib29sZWFuXCJ9KVxuZXhwb3J0IGNvbnN0IG51bGxTY2hlbWEgOiBTY2hlbWE8bnVsbD4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudWxsXCJ9KVxuZXhwb3J0IGNvbnN0IGFueTogU2NoZW1hPGFueT4gPSBmcm9tSnNvblNjaGVtYSh7fSlcbmV4cG9ydCBjb25zdCBvcHRpb25hbCA9IDxUPihzY2hlbWE6IFNjaGVtYTxUPikgOiBTY2hlbWE8VCB8IG51bGw+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogW3t0eXBlOiBcIm51bGxcIn0sIHNjaGVtYS5qc29uXX0pXG5leHBvcnQgY29uc3QgYXJyYXkgPSA8VD4oaXRlbVNjaGVtYTogU2NoZW1hPFQ+KTogU2NoZW1hPFRbXT4gPT4gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYXJyYXlcIiwgaXRlbXM6IGl0ZW1TY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3QgY29uc3RhbnQgPSA8VCBleHRlbmRzIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4+KHZhbHVlOiBUKTogU2NoZW1hPFQ+ID0+IGZyb21Kc29uU2NoZW1hKHtjb25zdDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3Qgb2JqZWN0ID0gPFMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBTY2hlbWE8YW55Pj4+IChzaGFwZTogUyk6IFNjaGVtYTx7W0sgaW4ga2V5b2YgU106IEluZmVyPFNbS10+fT4gPT4gZnJvbUpzb25TY2hlbWEoe1xuICB0eXBlOiBcIm9iamVjdFwiLFxuICBwcm9wZXJ0aWVzOiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMoc2hhcGUpLm1hcCgoW2tleSwgZmllbGRdKT0+IFtrZXksIGZpZWxkLmpzb25dKSksXG4gIHJlcXVpcmVkOiBPYmplY3Qua2V5cyhzaGFwZSlcbn0pXG5cbmV4cG9ydCBjb25zdCByZWNvcmQgPSA8VD4odmFsdWVTY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxSZWNvcmQ8c3RyaW5nLCBUPj4gPT4gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwib2JqZWN0XCIsIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiB2YWx1ZVNjaGVtYS5qc29ufSlcbmV4cG9ydCBjb25zdCBzY2hlbWFTY2hlbWEgOiBTY2hlbWE8SlNPTlNjaGVtYT4gPSByZWNvcmQoYW55KVxuXG5leHBvcnQgY29uc3QgdW5pb24gPSA8UyBleHRlbmRzIFNjaGVtYTxhbnk+W10+KC4uLnNjaGVtYXM6IFMpOiBTY2hlbWE8SW5mZXI8U1tudW1iZXJdPj4gPT4gZnJvbUpzb25TY2hlbWEoe2FueU9mOiBzY2hlbWFzLm1hcChzPT4gcy5qc29uKX0pXG5cbmV4cG9ydCBmdW5jdGlvbiB0YWdnZWQgPFMgZXh0ZW5kcyB7W2tleSA6IHN0cmluZ106IFNjaGVtYTxhbnk+fT4gKGZpZWxkczogUykgOiBTY2hlbWE8e1trZXkgaW4ga2V5b2YgU106IHskOiBrZXksIHZhbDpJbmZlcjxTW2tleV0+fSB9W2tleW9mIFNdPiB7XG4gIHJldHVybiB1bmlvbiguLi5PYmplY3QuZW50cmllcyhmaWVsZHMpLm1hcCgoWyQsdmFsXSk9Pm9iamVjdCh7JDpjb25zdGFudCgkKSx2YWx9KSkpXG59XG5cblxuXG5cbmV4cG9ydCBjb25zdCBpbnRlcnNlY3Rpb24gPSA8UyBleHRlbmRzIFNjaGVtYTxhbnk+W10+KC4uLnNjaGVtYXM6IFMpOiBTY2hlbWE8SW5mZXI8U1tudW1iZXJdPj4gPT4gZnJvbUpzb25TY2hlbWEoe2FsbE9mOiBzY2hlbWFzLm1hcChzPT4gcy5qc29uKX0pXG5cbmV4cG9ydCBjb25zdCBhc1R5cGVWaWV3ID0gKHNjaGVtYTogU2NoZW1hPGFueT4pOiBzdHJpbmcgPT4ge1xuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJzdHJpbmdcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bWJlclwiKSByZXR1cm4gXCJudW1iZXJcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcImJvb2xlYW5cIikgcmV0dXJuIFwiYm9vbGVhblwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJhcnJheVwiICYmIHNjaGVtYS5qc29uLml0ZW1zKSByZXR1cm4gYCR7YXNUeXBlVmlldyh7anNvbjogc2NoZW1hLmpzb24uaXRlbXMgYXMgSlNPTlNjaGVtYX0pfVtdYFxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm9iamVjdFwiICYmIHNjaGVtYS5qc29uLnByb3BlcnRpZXMpe1xuICAgIGxldCBwcm9wcyA9IE9iamVjdC5lbnRyaWVzKHNjaGVtYS5qc29uLnByb3BlcnRpZXMpLm1hcCgoW2tleSwgcHJvcF0pPT4gYCR7a2V5fTogJHthc1R5cGVWaWV3KHtqc29uOiBwcm9wIGFzIEpTT05TY2hlbWF9KX1gKVxuICAgIHJldHVybiBge1xcbiAgJHtwcm9wcy5qb2luKFwiLFxcblwiKS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiXFxuICBcIil9XFxufWBcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYS5qc29uKSByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc2NoZW1hLmpzb24uY29uc3QpXG4gIGlmIChcImFueU9mXCIgaW4gc2NoZW1hLmpzb24gJiYgQXJyYXkuaXNBcnJheShzY2hlbWEuanNvbi5hbnlPZikpIHJldHVybiBzY2hlbWEuanNvbi5hbnlPZi5tYXAocz0+IGFzVHlwZVZpZXcoe2pzb246IHMgYXMgSlNPTlNjaGVtYX0pKS5qb2luKFwiIHwgXCIpXG4gIHJldHVybiBcImFueVwiXG59XG5cblxuIiwKICAgICJpbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuL3JvYWRtYXBcIjtcbmltcG9ydCB7IGFycmF5LCBib29sZWFuLCBjb25zdGFudCwgbnVtYmVyLCBvYmplY3QsIHN0cmluZywgdGFnZ2VkLCB1bmlvbiwgdHlwZSBJbmZlciwgdHlwZSBTY2hlbWEgfSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuZXhwb3J0IHR5cGUgVVVJRCA9IGB1JHtzdHJpbmd9LSR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBVVUlEIDogU2NoZW1hPFVVSUQ+ID0gc3RyaW5nXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21VVUlEKCkge3JldHVybiBcInVcIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSArIFwiLVwiICsgcmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIsMTApIGFzIFVVSUR9XG5cblxuZXhwb3J0IGNvbnN0IFJlcXVlc3QgPSBvYmplY3Qoe1xuICBpZDogVVVJRCxcbiAgc3RhcnRQb2ludDogbnVtYmVyLFxuICBlbmRQb2ludDogbnVtYmVyLFxuICB2YWx1ZV9ldXI6IG51bWJlcixcbiAgZGVhZGxpbmVfaDogbnVtYmVyLFxufSlcblxuZXhwb3J0IGNvbnN0IFRyYW5zcG9ydGVyID0gb2JqZWN0KHsgaWQ6IFVVSUQsIHBvc2l0aW9uOiBVVUlELCB9KVxuXG5leHBvcnQgY29uc3QgU2NoZWR1bGVTdGVwID0gdGFnZ2VkKHtcbiAgcGlja3VwOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyLCBkZWNrOiB1bmlvbihjb25zdGFudCgwKSwgY29uc3RhbnQoMSkpfSksXG4gIGRlbGl2ZXI6IG9iamVjdCh7cmVxdWVzdDogVVVJRCwgcG9zOiBudW1iZXJ9KSxcbiAgc3RhcnQ6IG9iamVjdCh7cG9zOiBudW1iZXJ9KSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGVJdGVtID0gb2JqZWN0KHtcbiAgdHJhbnNwb3J0ZXI6IFVVSUQsXG4gIHN0ZXBzOiBhcnJheShTY2hlZHVsZVN0ZXApLFxufSlcbmV4cG9ydCBjb25zdCBTY2hlZHVsZSA9IGFycmF5KFNjaGVkdWxlSXRlbSlcblxuXG5leHBvcnQgdHlwZSBSZXF1ZXN0ID0gSW5mZXI8dHlwZW9mIFJlcXVlc3Q+XG5leHBvcnQgdHlwZSBUcmFuc3BvcnRlciA9IEluZmVyPHR5cGVvZiBUcmFuc3BvcnRlcj5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlU3RlcCA9IEluZmVyPHR5cGVvZiBTY2hlZHVsZVN0ZXA+XG5leHBvcnQgdHlwZSBTY2hlZHVsZUl0ZW0gPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVJdGVtPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGUgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGU+XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbU1vZHVsZSAoXG4gIE5SRVFTID0gMjAwLFxuICBOVFJBTlMgPSA0MCxcbiAgTlBPSU5UUyA9IDEwMCxcbiAgTUFQU0laRSA9IDQwMCxcbiAgc2VlZCA9IDIyLFxuKXtcblxuICBjb25zdCByb2FkbWFwID0gcmFuZG9tTWFwKE5QT0lOVFMsIE1BUFNJWkUpXG5cbiAgcmV0dXJuIHtcbiAgICBOVFJBTlMsXG4gICAgTlJFUVMsXG4gICAgTUFQU0laRSxcbiAgICBSU0laRTogTlBPSU5UUyAqIE5QT0lOVFMgLyAyLFxuICAgIHJvYWRtYXAsXG4gICAgcmVxdWVzdHM6IEFycmF5LmZyb20oe2xlbmd0aDpOUkVRU30sIChfLGkpPT4gKHtcbiAgICAgIGlkOiByYW5kb21VVUlEKCksXG4gICAgICBkZWFkbGluZV9oOiAoMStyYW5kb20oKSkgKiA0MCxcbiAgICAgIHN0YXJ0UG9pbnQ6IHJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSkgYXMgbnVtYmVyLFxuICAgICAgZW5kUG9pbnQ6IHJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSkgYXMgbnVtYmVyLFxuICAgICAgdmFsdWVfZXVyOiByYW5kSW50KDEwMCwgNDAwKSxcbiAgICB9KSBhcyBSZXF1ZXN0KSxcbiAgICBzdGFydHBvc2l0aW9uczogQXJyYXkuZnJvbSh7bGVuZ3RoOk5UUkFOU30sIChfLGkpPT5yYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlciksXG4gIH1cbn1cblxuXG5leHBvcnQgdHlwZSBNb2R1bGUgPSB0eXBlb2YgcmFuZG9tTW9kdWxlIGV4dGVuZHMgKC4uLng6YW55KSA9PiAoaW5mZXIgVCkgPyBUIDogbmV2ZXJcblxuIiwKICAgICJpbXBvcnQgeyB2YWxpZGF0ZSwgdHlwZSBKc29uRGF0YSwgdHlwZSBTY2hlbWEgfSBmcm9tIFwiLi9zY2hlbWFcIlxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rV3JpdGFibGU8VCBleHRlbmRzIEpzb25EYXRhPiAodmFsdWU6IFQpIHtcblxuICBsZXQgbGlzdGVuZXJzOiAoKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZTogVCk9PnZvaWQpW10gPSBbXVxuICBsZXQgcmVwID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpXG5cbiAgbGV0IHJlcyA9IHtcbiAgICBnZXQ6ICgpID0+IHZhbHVlLFxuICAgIHNldDogKG5ld1ZhbHVlOiBUKSA9PiB7XG4gICAgICBsZXQgbmV3UmVwID0gSlNPTi5zdHJpbmdpZnkobmV3VmFsdWUpXG4gICAgICBpZiAobmV3UmVwID09PSByZXApIHJldHVyblxuICAgICAgcmVwID0gbmV3UmVwXG4gICAgICBsaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKG5ld1ZhbHVlLCB2YWx1ZSkpXG4gICAgICB2YWx1ZSA9IG5ld1ZhbHVlXG4gICAgfSxcbiAgICBvbnVwZGF0ZTogKGxpc3RlbmVyOiAobmV3VmFsdWU6IFQsIG9sZFZhbHVlIDpUKT0+dm9pZCwgZGVmZXJyZWQgPSBmYWxzZSkgPT4ge1xuICAgICAgaWYgKCFkZWZlcnJlZCkgbGlzdGVuZXIodmFsdWUsIHZhbHVlKVxuICAgICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpXG4gICAgfSxcbiAgICB1cGRhdGU6IChjYWxsYmFjazogKG9sZFZhbHVlOiBUKT0+VCB8IHVuZGVmaW5lZCkgPT4ge1xuICAgICAgbGV0IG5ld1ZhbHVlID0gY2FsbGJhY2sodmFsdWUpID8/IHZhbHVlXG4gICAgICByZXMuc2V0KG5ld1ZhbHVlKVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIHJlc1xuXG59XG5cbmV4cG9ydCB0eXBlIFdyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gPSBSZXR1cm5UeXBlPHR5cGVvZiBta1dyaXRhYmxlPFQ+PlxuXG5leHBvcnQgZnVuY3Rpb24gbWtTdG9yZWQgPFQgZXh0ZW5kcyBKc29uRGF0YT4gKGtleTogc3RyaW5nLCBzY2hlbWE6IFNjaGVtYTxUPiwgZGVmYXVsdFZhbHVlOiBUKSB7XG4gIGxldCB2YWwgPSBkZWZhdWx0VmFsdWVcbiAgdHJ5e1xuICAgIHZhbCA9IHZhbGlkYXRlKHNjaGVtYSwgSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpISkpXG4gIH1jYXRjaHt9XG5cbiAgbGV0IHJlcyA9IG1rV3JpdGFibGU8VD4odmFsKVxuICBcbiAgcmVzLm9udXBkYXRlKChuZXdWYWx1ZSk9PntcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKSlcbiAgfSlcblxuICByZXR1cm4gcmVzXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5cbmV4cG9ydCBjb25zdCBLTV9DT1NUX0NFTlRTID0gNTA7XG5leHBvcnQgY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuZXhwb3J0IGNvbnN0IFJFT1JHX0NPU1RfQ0VOVFMgPSAxMF8wMDA7XG5leHBvcnQgY29uc3QgSU5GID0gMSA8PCAzMDtcblxuZXhwb3J0IHR5cGUgUGFpckluZm8gPSB7XG4gIHJlcTogbnVtYmVyO1xuICBmaXJzdDogbnVtYmVyO1xuICBzZWNvbmQ6IG51bWJlcjtcbiAgZGVjazogMCB8IDE7XG59O1xuXG5leHBvcnQgdHlwZSBBbm5lYWxpbmdTdGF0ZSA9IHtcbiAgbW9kOiBNb2R1bGU7XG4gIE5SRVFTOiBudW1iZXI7XG4gIE5UUkFOUzogbnVtYmVyO1xuICBUU0laRTogbnVtYmVyO1xuICByZXFQaWNrdXBMb2NhdGlvbnM6IFVpbnQxNkFycmF5O1xuICByZXFEZWxpdmVyeUxvY2F0aW9uczogVWludDE2QXJyYXk7XG4gIHJlcURlYWRsaW5lczogVWludDMyQXJyYXk7XG4gIHJlcVZhbHVlczogVWludDMyQXJyYXk7XG4gIHVuYXNzaWduZWQ6IEludDhBcnJheTtcbiAgdHJhblN0YXJ0OiBVaW50MTZBcnJheTtcbiAgc2NoZWR1bGU6IFVpbnQzMkFycmF5O1xuICBzY2hlZHVsZVNpemVzOiBVaW50MTZBcnJheTtcbiAgc2NoZWR1bGVSYXRpbmdzOiBJbnQzMkFycmF5O1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzTG9hZCh4OiBudW1iZXIpIHtcbiAgcmV0dXJuIHggJiAxO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVjayh4OiBudW1iZXIpIHtcbiAgcmV0dXJuICgoeCAmIDIpID4+IDEpIGFzIDAgfCAxO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVxKHg6IG51bWJlcikge1xuICByZXR1cm4gKHggJiAweGZmZmYpID4+IDI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQb3MoeDogbnVtYmVyKSB7XG4gIHJldHVybiB4ID4+IDE2O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdEFubmVhbGluZ1N0YXRlKG1vZDogTW9kdWxlLCBzZWVkPzogQW5uZWFsaW5nUmVzdWx0KTogQW5uZWFsaW5nU3RhdGUge1xuICBjb25zdCB7IE5SRVFTLCByZXF1ZXN0cywgc3RhcnRwb3NpdGlvbnMsIE5UUkFOUyB9ID0gbW9kO1xuICBjb25zdCBUU0laRSA9IE1hdGguZmxvb3IoTlJFUVMgKiAyLjUgKyAxMCk7XG5cbiAgcmV0dXJuIHtcbiAgICBtb2QsXG4gICAgTlJFUVMsXG4gICAgTlRSQU5TLFxuICAgIFRTSVpFLFxuICAgIHJlcVBpY2t1cExvY2F0aW9uczogbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5zdGFydFBvaW50KSksXG4gICAgcmVxRGVsaXZlcnlMb2NhdGlvbnM6IG5ldyBVaW50MTZBcnJheShyZXF1ZXN0cy5tYXAoKHIpID0+IHIuZW5kUG9pbnQpKSxcbiAgICByZXFEZWFkbGluZXM6IG5ldyBVaW50MzJBcnJheShyZXF1ZXN0cy5tYXAoKHIpID0+IE1hdGguZmxvb3Ioci5kZWFkbGluZV9oICogNjApKSksXG4gICAgcmVxVmFsdWVzOiBuZXcgVWludDMyQXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiBNYXRoLnJvdW5kKHIudmFsdWVfZXVyICogMTAwKSkpLFxuICAgIHVuYXNzaWduZWQ6IHNlZWQgPyBuZXcgSW50OEFycmF5KHNlZWQudW5hc3NpZ25lZCkgOiBuZXcgSW50OEFycmF5KHJlcXVlc3RzLm1hcCgoKSA9PiAxKSksXG4gICAgdHJhblN0YXJ0OiBuZXcgVWludDE2QXJyYXkoc3RhcnRwb3NpdGlvbnMpLFxuICAgIHNjaGVkdWxlOiBzZWVkID8gbmV3IFVpbnQzMkFycmF5KHNlZWQuc2NoZWR1bGUpIDogbmV3IFVpbnQzMkFycmF5KFRTSVpFICogTlRSQU5TKSxcbiAgICBzY2hlZHVsZVNpemVzOiBzZWVkID8gbmV3IFVpbnQxNkFycmF5KHNlZWQuc2NoZWR1bGVTaXplcykgOiBuZXcgVWludDE2QXJyYXkoTlRSQU5TKSxcbiAgICBzY2hlZHVsZVJhdGluZ3M6IHNlZWQgPyBuZXcgSW50MzJBcnJheShzZWVkLnNjaGVkdWxlUmF0aW5ncykgOiBuZXcgSW50MzJBcnJheShOVFJBTlMpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcm91dGVPZmZzZXQoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIpIHtcbiAgcmV0dXJuIHRyYW4gKiBzdGF0ZS5UU0laRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFJlcShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgaWR4OiBudW1iZXIsIGlzTG9hZEJpdDogMSB8IDAsIGRlY2s6IDAgfCAxLCByZXE6IG51bWJlciwgcG9zOiBudW1iZXIpIHtcbiAgc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pICsgaWR4XSA9IChpc0xvYWRCaXQgPDwgMCkgfCAoZGVjayA8PCAxKSB8IChyZXEgPDwgMikgfCAocG9zIDw8IDE2KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNjb3JlUm91dGUoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIpIHtcbiAgbGV0IHJld2FyZCA9IDA7XG4gIGxldCBjb3N0ID0gMDtcbiAgbGV0IGVsYXBzZWRNaW51dGVzID0gMDtcbiAgY29uc3QgZGVja3M6IFtudW1iZXJbXSwgbnVtYmVyW11dID0gW1tdLCBbXV07XG4gIGxldCBwb3MgPSBzdGF0ZS50cmFuU3RhcnRbdHJhbl0hO1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKTtcbiAgICBjb25zdCBuZXh0UG9zID0gZ2V0UG9zKHN0ZXApO1xuICAgIGNvbnN0IGRpc3RhbmNlID0gc3RhdGUubW9kLnJvYWRtYXAuZ2V0Q29zdE4ocG9zLCBuZXh0UG9zKTtcbiAgICBjb3N0ICs9IGRpc3RhbmNlICogS01fQ09TVF9DRU5UUztcbiAgICBlbGFwc2VkTWludXRlcyArPSBkaXN0YW5jZSAqIDYwIC8gQVZHX1NQRUVEX0tNSDtcbiAgICBwb3MgPSBuZXh0UG9zO1xuXG4gICAgaWYgKGxvYWQpIHtcbiAgICAgIGNvbnN0IGRlY2sgPSBkZWNrc1tnZXREZWNrKHN0ZXApXSE7XG4gICAgICBkZWNrLnB1c2gocmVxKTtcbiAgICAgIGlmIChkZWNrLmxlbmd0aCA+IDMpIHJldHVybiAtSU5GO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgY29uc3QgaWR4ID0gZGVjay5pbmRleE9mKHJlcSk7XG4gICAgICBpZiAoaWR4ID09PSAtMSkgcmV0dXJuIC1JTkY7XG4gICAgICBjb3N0ICs9IChkZWNrLmxlbmd0aCAtIGlkeCAtIDEpICogUkVPUkdfQ09TVF9DRU5UUztcbiAgICAgIGRlY2suc3BsaWNlKGlkeCwgMSk7XG4gICAgICBpZiAoZWxhcHNlZE1pbnV0ZXMgPD0gc3RhdGUucmVxRGVhZGxpbmVzW3JlcV0hKSByZXdhcmQgKz0gc3RhdGUucmVxVmFsdWVzW3JlcV0hO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXdhcmQgLSBjb3N0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaEFsbFJhdGluZ3Moc3RhdGU6IEFubmVhbGluZ1N0YXRlKSB7XG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBzdGF0ZS5zY2hlZHVsZVJhdGluZ3NbdHJhbl0gPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBtYXhMb3NzID0gMTJfMDAwKSB7XG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBpZiAoc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSAhPT0gMCkgY29udGludWU7XG5cbiAgICBsZXQgYmVzdFJlcSA9IC0xO1xuICAgIGxldCBiZXN0U2NvcmUgPSAtSU5GO1xuXG4gICAgZm9yIChsZXQgcmVxID0gMDsgcmVxIDwgc3RhdGUuTlJFUVM7IHJlcSsrKSB7XG4gICAgICBpZiAoIXN0YXRlLnVuYXNzaWduZWRbcmVxXSkgY29udGludWU7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgMCwgMCwgMCwgcmVxKTtcbiAgICAgIGNvbnN0IHNjb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgMCwgMSk7XG4gICAgICBpZiAoc2NvcmUgPiBiZXN0U2NvcmUpIHtcbiAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgIGJlc3RSZXEgPSByZXE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RSZXEgPT09IC0xIHx8IGJlc3RTY29yZSA8IC1tYXhMb3NzKSBjb250aW51ZTtcblxuICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCAwLCAwLCAwLCBiZXN0UmVxKTtcbiAgICBzdGF0ZS5zY2hlZHVsZVJhdGluZ3NbdHJhbl0gPSBiZXN0U2NvcmU7XG4gICAgc3RhdGUudW5hc3NpZ25lZFtiZXN0UmVxXSA9IDA7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFN0b3BzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlciwgZGVjazogMCB8IDEsIHJlcTogbnVtYmVyKSB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dID0gc2l6ZSArIDI7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kICsgMiwgb2Zmc2V0ICsgZW5kLCBvZmZzZXQgKyBzaXplKTtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBzdGFydCArIDEsIG9mZnNldCArIHN0YXJ0LCBvZmZzZXQgKyBlbmQgKyAxKTtcbiAgc2V0UmVxKHN0YXRlLCB0cmFuLCBzdGFydCwgMSwgZGVjaywgcmVxLCBzdGF0ZS5yZXFQaWNrdXBMb2NhdGlvbnNbcmVxXSEpO1xuICBzZXRSZXEoc3RhdGUsIHRyYW4sIGVuZCArIDEsIDAsIGRlY2ssIHJlcSwgc3RhdGUucmVxRGVsaXZlcnlMb2NhdGlvbnNbcmVxXSEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlU3RvcHMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dID0gc2l6ZSAtIDI7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgZW5kKTtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBlbmQgLSAxLCBvZmZzZXQgKyBlbmQgKyAxLCBvZmZzZXQgKyBzaXplKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRQYWlySW5Sb3V0ZShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgcmVxOiBudW1iZXIpOiBQYWlySW5mbyB8IG51bGwge1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG4gIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgbGV0IGZpcnN0ID0gLTE7XG4gIGxldCBzZWNvbmQgPSAtMTtcbiAgbGV0IGRlY2s6IDAgfCAxID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgIGNvbnN0IHN0ZXAgPSBzdGF0ZS5zY2hlZHVsZVtvZmZzZXQgKyBpXSE7XG4gICAgaWYgKGdldFJlcShzdGVwKSAhPT0gcmVxKSBjb250aW51ZTtcbiAgICBpZiAoZmlyc3QgPT09IC0xKSB7XG4gICAgICBmaXJzdCA9IGk7XG4gICAgICBkZWNrID0gZ2V0RGVjayhzdGVwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2Vjb25kID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChmaXJzdCA9PT0gLTEgfHwgc2Vjb25kID09PSAtMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IHJlcSwgZmlyc3QsIHNlY29uZCwgZGVjayB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlVW5hc3NpZ25lZFJlcShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heEF0dGVtcHRzID0gMjQpOiBudW1iZXIgfCBudWxsIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhBdHRlbXB0czsgaSsrKSB7XG4gICAgY29uc3QgcmVxID0gcmFuZEludCgwLCBzdGF0ZS5OUkVRUyk7XG4gICAgaWYgKHN0YXRlLnVuYXNzaWduZWRbcmVxXSkgcmV0dXJuIHJlcTtcbiAgfVxuXG4gIGZvciAobGV0IHJlcSA9IDA7IHJlcSA8IHN0YXRlLk5SRVFTOyByZXErKykge1xuICAgIGlmIChzdGF0ZS51bmFzc2lnbmVkW3JlcV0pIHJldHVybiByZXE7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhbXBsZUFzc2lnbmVkUGFpcihzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heEF0dGVtcHRzID0gMjQpOiB7IHRyYW46IG51bWJlcjsgcGFpcjogUGFpckluZm8gfSB8IG51bGwge1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IG1heEF0dGVtcHRzOyBhdHRlbXB0KyspIHtcbiAgICBjb25zdCB0cmFuID0gcmFuZEludCgwLCBzdGF0ZS5OVFJBTlMpO1xuICAgIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2l6ZSA8IDIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2l6ZSk7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKHN0YXRlLnNjaGVkdWxlW3JvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKSArIGlkeF0hKTtcbiAgICBjb25zdCBwYWlyID0gZmluZFBhaXJJblJvdXRlKHN0YXRlLCB0cmFuLCByZXEpO1xuICAgIGlmIChwYWlyKSByZXR1cm4geyB0cmFuLCBwYWlyIH07XG4gIH1cblxuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHN0YXRlLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGlmIChzaXplIDwgMikgY29udGludWU7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKHN0YXRlLnNjaGVkdWxlW3JvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKV0hKTtcbiAgICBjb25zdCBwYWlyID0gZmluZFBhaXJJblJvdXRlKHN0YXRlLCB0cmFuLCByZXEpO1xuICAgIGlmIChwYWlyKSByZXR1cm4geyB0cmFuLCBwYWlyIH07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFjY2VwdEFubmVhbChwcmV2U2NvcmU6IG51bWJlciwgbmV4dFNjb3JlOiBudW1iZXIsIHRlbXA6IG51bWJlcikge1xuICBpZiAobmV4dFNjb3JlID49IHByZXZTY29yZSkgcmV0dXJuIHRydWU7XG4gIGNvbnN0IGRlbHRhID0gcHJldlNjb3JlIC0gbmV4dFNjb3JlO1xuICByZXR1cm4gcmFuZG9tKCkgPCBNYXRoLmV4cCgtZGVsdGEgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9Bbm5lYWxpbmdSZXN1bHQoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBlbGFwc2VkTXM6IG51bWJlcik6IEFubmVhbGluZ1Jlc3VsdCB7XG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGU6IHN0YXRlLnNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHN0YXRlLnNjaGVkdWxlU2l6ZXMsXG4gICAgdHJhblN0YXJ0OiBzdGF0ZS50cmFuU3RhcnQsXG4gICAgVFNJWkU6IHN0YXRlLlRTSVpFLFxuICAgIHNjaGVkdWxlUmF0aW5nczogc3RhdGUuc2NoZWR1bGVSYXRpbmdzLFxuICAgIHVuYXNzaWduZWQ6IHN0YXRlLnVuYXNzaWduZWQsXG4gICAgZWxhcHNlZE1zLFxuICAgIHRvdGFsU2NvcmU6IHN0YXRlLnNjaGVkdWxlUmF0aW5ncy5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSxcbiAgfTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7XG4gIGJvb3RzdHJhcEVtcHR5Um91dGVzLFxuICBnZXREZWNrLFxuICBnZXRSZXEsXG4gIGluaXRBbm5lYWxpbmdTdGF0ZSxcbiAgaW5zZXJ0U3RvcHMsXG4gIHJlbW92ZVN0b3BzLFxuICBzY29yZVJvdXRlLFxuICB0b0FubmVhbGluZ1Jlc3VsdCxcbn0gZnJvbSBcIi4vYW5uZWFsaW5nX3NoYXJlZFwiO1xuXG5leHBvcnQgdHlwZSBBbm5lYWxpbmdSZXN1bHQgPSB7XG4gIHNjaGVkdWxlOiBVaW50MzJBcnJheTtcbiAgc2NoZWR1bGVTaXplczogVWludDE2QXJyYXk7XG4gIHRyYW5TdGFydDogVWludDE2QXJyYXk7XG4gIFRTSVpFOiBudW1iZXI7XG4gIHNjaGVkdWxlUmF0aW5nczogSW50MzJBcnJheTtcbiAgdW5hc3NpZ25lZDogSW50OEFycmF5O1xuICBlbGFwc2VkTXM6IG51bWJlcjtcbiAgdG90YWxTY29yZTogbnVtYmVyO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2VsaW5lQW5uZWFsaW5nKG1vZDogTW9kdWxlLCBzdGVwcyA9IDFfNjAwXzAwMCk6IEFubmVhbGluZ1Jlc3VsdCB7XG4gIGNvbnN0IHN0YXRlID0gaW5pdEFubmVhbGluZ1N0YXRlKG1vZCk7XG4gIGNvbnN0IHsgTlJFUVMsIE5UUkFOUywgVFNJWkUsIHNjaGVkdWxlLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuXG4gIGxldCBzdGFydFRlbXAgPSA1XzAwMDtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2UmF0aW5nOiBudW1iZXIsIG5leHRSYXRpbmc6IG51bWJlcikge1xuICAgIGlmIChuZXh0UmF0aW5nID49IHByZXZSYXRpbmcpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0UmF0aW5nIC0gcHJldlJhdGluZykgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2NoZWRTaXplICsgMSk7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKHNjaGVkU2l6ZSwgcmFuZEludCgwLCA0KSArIGEpO1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpO1xuICAgIGlmICghdW5hc3NpZ25lZFtyZXFdKSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcmFuZG9tKCkgPiAwLjUgPyAxIDogMCwgcmVxKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICBjb25zdCBzY2hlZFNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2NoZWRTaXplIDwgMikgcmV0dXJuO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2NoZWRTaXplKTtcbiAgICBjb25zdCBpdGVtID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSE7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKGl0ZW0pO1xuXG4gICAgY29uc3QgYWI6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZFNpemU7IGkrKykge1xuICAgICAgaWYgKGdldFJlcShzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSEpID09PSByZXEpIGFiLnB1c2goaSk7XG4gICAgfVxuICAgIGlmIChhYi5sZW5ndGggIT09IDIpIHJldHVybjtcblxuICAgIGNvbnN0IFthLCBiXSA9IGFiIGFzIFtudW1iZXIsIG51bWJlcl07XG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIpO1xuICAgIGNvbnN0IG5ld1JhdGluZyA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgIGlmIChhY2NlcHQoc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgbmV3UmF0aW5nKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gbmV3UmF0aW5nO1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgLSAxLCBnZXREZWNrKGl0ZW0pIGFzIDAgfCAxLCByZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrKSB7XG4gICAgdGVtcCA9ICgxIC0gaSAvIHN0ZXBzKSAqIHN0YXJ0VGVtcDtcbiAgICB0cnlVbmFzc2lnbigpO1xuICAgIHRyeUFzc2lnbigpO1xuICB9XG5cbiAgcmV0dXJuIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlLCBEYXRlLm5vdygpIC0gc3RhcnRlZEF0KTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZyB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHtcbiAgYWNjZXB0QW5uZWFsLFxuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgdHlwZSBQYWlySW5mbyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNhbXBsZUFzc2lnbmVkUGFpcixcbiAgc2FtcGxlVW5hc3NpZ25lZFJlcSxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxudHlwZSBJbXByb3ZlZE9wdGlvbnMgPVxuICB8IHsgc3RlcHM6IG51bWJlcjsgYnVkZ2V0TXM/OiBuZXZlciB9XG4gIHwgeyBidWRnZXRNczogbnVtYmVyOyBzdGVwcz86IG5ldmVyIH07XG5cbmV4cG9ydCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiA9IHtcbiAgaXRlcmF0ZVN0ZXBzOiAoc3RlcHM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBpdGVyYXRlRm9yTXM6IChidWRnZXRNczogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG4gIGdldFJlc3VsdDogKCkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICByZWhlYXQ6IChmYWN0b3I/OiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kOiBNb2R1bGUsIHRhcmdldFN0ZXBzID0gMTUwMDAwKTogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHtcbiAgY29uc3Qgd2FybXVwU3RlcHMgPSBNYXRoLm1pbihNYXRoLm1heCgyMDAwMCwgTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMikpLCA1MDAwMCk7XG4gIGNvbnN0IHdhcm11cCA9IGJhc2VsaW5lQW5uZWFsaW5nKG1vZCwgd2FybXVwU3RlcHMpO1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QsIHdhcm11cCk7XG4gIGNvbnN0IHsgTlRSQU5TLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuICBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZSk7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDZfMDAwO1xuICBsZXQgZW5kVGVtcCA9IDI1O1xuICBsZXQgdGVtcCA9IHN0YXJ0VGVtcDtcblxuICBmdW5jdGlvbiB0cnlBc3NpZ25TYW1wbGVkKHNhbXBsZXMgPSA4KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7IHRyYW46IG51bWJlcjsgcmVxOiBudW1iZXI7IGE6IG51bWJlcjsgYjogbnVtYmVyOyBkZWNrOiAwIHwgMTsgc2NvcmU6IG51bWJlciB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCByZXEgPSBzYW1wbGVVbmFzc2lnbmVkUmVxKHN0YXRlKTtcbiAgICAgIGlmIChyZXEgPT0gbnVsbCkgYnJlYWs7XG5cbiAgICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgICBjb25zdCBzaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBzaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oc2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgc2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgY29uc3QgZGVjayA9IChyYW5kb20oKSA+IDAuNSA/IDEgOiAwKSBhcyAwIHwgMTtcblxuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIsIGRlY2ssIHJlcSk7XG4gICAgICBjb25zdCBuZXdTY29yZSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgKyAxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IG5ld1Njb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0geyB0cmFuLCByZXEsIGEsIGIsIGRlY2ssIHNjb3JlOiBuZXdTY29yZSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5hLCBiZXN0LmIsIGJlc3QuZGVjaywgYmVzdC5yZXEpO1xuICAgIGlmIChhY2NlcHRBbm5lYWwoc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0hLCBiZXN0LnNjb3JlLCB0ZW1wKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0gPSBiZXN0LnNjb3JlO1xuICAgICAgdW5hc3NpZ25lZFtiZXN0LnJlcV0gPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LmEsIGJlc3QuYiArIDEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVVuYXNzaWduU2FtcGxlZChzYW1wbGVzID0gNikge1xuICAgIGxldCBiZXN0OiBudWxsIHwgeyB0cmFuOiBudW1iZXI7IHBhaXI6IFBhaXJJbmZvOyBzY29yZTogbnVtYmVyIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IGNob3NlbiA9IHNhbXBsZUFzc2lnbmVkUGFpcihzdGF0ZSk7XG4gICAgICBpZiAoIWNob3NlbikgYnJlYWs7XG4gICAgICBjb25zdCB7IHRyYW4sIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG4gICAgICBjb25zdCBuZXdTY29yZSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBuZXdTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHsgdHJhbiwgcGFpciwgc2NvcmU6IG5ld1Njb3JlIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQpO1xuICAgIGlmIChhY2NlcHRBbm5lYWwoc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0hLCBiZXN0LnNjb3JlLCB0ZW1wKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0gPSBiZXN0LnNjb3JlO1xuICAgICAgdW5hc3NpZ25lZFtiZXN0LnBhaXIucmVxXSA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlSZWxvY2F0ZVNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHtcbiAgICAgIHNyYzogbnVtYmVyO1xuICAgICAgZHN0OiBudW1iZXI7XG4gICAgICBwYWlyOiBQYWlySW5mbztcbiAgICAgIGluc2VydEE6IG51bWJlcjtcbiAgICAgIGluc2VydEI6IG51bWJlcjtcbiAgICAgIHNjb3JlOiBudW1iZXI7XG4gICAgICBvbGRTY29yZTogbnVtYmVyO1xuICAgIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IGNob3NlbiA9IHNhbXBsZUFzc2lnbmVkUGFpcihzdGF0ZSk7XG4gICAgICBpZiAoIWNob3NlbikgYnJlYWs7XG5cbiAgICAgIGNvbnN0IHsgdHJhbjogc3JjLCBwYWlyIH0gPSBjaG9zZW47XG4gICAgICBjb25zdCBkc3QgPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgICBjb25zdCBvbGRTY29yZSA9IHNyYyA9PT0gZHN0XG4gICAgICAgID8gc2NoZWR1bGVSYXRpbmdzW3NyY10hXG4gICAgICAgIDogc2NoZWR1bGVSYXRpbmdzW3NyY10hICsgc2NoZWR1bGVSYXRpbmdzW2RzdF0hO1xuXG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgc3JjLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG5cbiAgICAgIGNvbnN0IGRzdFNpemUgPSBzY2hlZHVsZVNpemVzW2RzdF0hO1xuICAgICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgZHN0U2l6ZSArIDEpO1xuICAgICAgY29uc3QgYiA9IE1hdGgubWluKGRzdFNpemUsIGEgKyByYW5kSW50KDAsIE1hdGgubWluKDYsIGRzdFNpemUgLSBhICsgMSkpKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBkc3QsIGEsIGIsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBjb25zdCBjYW5kaWRhdGVTY29yZSA9IHNyYyA9PT0gZHN0XG4gICAgICAgID8gc2NvcmVSb3V0ZShzdGF0ZSwgc3JjKVxuICAgICAgICA6IHNjb3JlUm91dGUoc3RhdGUsIHNyYykgKyBzY29yZVJvdXRlKHN0YXRlLCBkc3QpO1xuXG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgZHN0LCBhLCBiICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgc3JjLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCAtIDEsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgY2FuZGlkYXRlU2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7XG4gICAgICAgICAgc3JjLFxuICAgICAgICAgIGRzdCxcbiAgICAgICAgICBwYWlyLFxuICAgICAgICAgIGluc2VydEE6IGEsXG4gICAgICAgICAgaW5zZXJ0QjogYixcbiAgICAgICAgICBzY29yZTogY2FuZGlkYXRlU2NvcmUsXG4gICAgICAgICAgb2xkU2NvcmUsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC5zcmMsIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QuZHN0LCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuXG4gICAgaWYgKGFjY2VwdEFubmVhbChiZXN0Lm9sZFNjb3JlLCBiZXN0LnNjb3JlLCB0ZW1wKSkge1xuICAgICAgaWYgKGJlc3Quc3JjID09PSBiZXN0LmRzdCkge1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5zcmNdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5zcmMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3Quc3JjXSA9IHNjb3JlUm91dGUoc3RhdGUsIGJlc3Quc3JjKTtcbiAgICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3QuZHN0XSA9IHNjb3JlUm91dGUoc3RhdGUsIGJlc3QuZHN0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QuZHN0LCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiArIDEpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3Quc3JjLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5UmVpbnNlcnRTYW1wbGVkKHNhbXBsZXMgPSA4KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7XG4gICAgICB0cmFuOiBudW1iZXI7XG4gICAgICBwYWlyOiBQYWlySW5mbztcbiAgICAgIGluc2VydEE6IG51bWJlcjtcbiAgICAgIGluc2VydEI6IG51bWJlcjtcbiAgICAgIHNjb3JlOiBudW1iZXI7XG4gICAgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcblxuICAgICAgY29uc3QgeyB0cmFuLCBwYWlyIH0gPSBjaG9zZW47XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQpO1xuXG4gICAgICBjb25zdCBzaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBzaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oc2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgc2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBjb25zdCBjYW5kaWRhdGVTY29yZSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuXG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBjYW5kaWRhdGVTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICB0cmFuLFxuICAgICAgICAgIHBhaXIsXG4gICAgICAgICAgaW5zZXJ0QTogYSxcbiAgICAgICAgICBpbnNlcnRCOiBiLFxuICAgICAgICAgIHNjb3JlOiBjYW5kaWRhdGVTY29yZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcblxuICAgIGlmIChhY2NlcHRBbm5lYWwoc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0hLCBiZXN0LnNjb3JlLCB0ZW1wKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0gPSBiZXN0LnNjb3JlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiArIDEpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHNlc3Npb25TdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICBsZXQgaSA9IDA7XG4gIGNvbnN0IHRlbXBGbG9vciA9IDE1MDtcbiAgY29uc3QgcmVoZWF0VGVtcCA9IDJfMjUwO1xuXG4gIGZ1bmN0aW9uIHJ1bkl0ZXJhdGlvbnMoaXRlcmF0aW9uQnVkZ2V0OiBudW1iZXIsIGRlYWRsaW5lID0gSW5maW5pdHkpIHtcbiAgICBjb25zdCBlbmRJdGVyYXRpb24gPSBNYXRoLm1pbih0YXJnZXRTdGVwcywgaSArIGl0ZXJhdGlvbkJ1ZGdldCk7XG4gICAgd2hpbGUgKGkgPCBlbmRJdGVyYXRpb24pIHtcbiAgICAgIGlmICgoaSAmIDIwNDcpID09PSAwICYmIERhdGUubm93KCkgPj0gZGVhZGxpbmUpIGJyZWFrO1xuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBpIC8gdGFyZ2V0U3RlcHM7XG4gICAgICB0ZW1wID0gc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgcHJvZ3Jlc3MpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBydW5UaW1lZENodW5rKGJ1ZGdldE1zOiBudW1iZXIpIHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBidWRnZXRNcztcblxuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXBGbG9vciwgc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgTWF0aC5taW4oMSwgcHJvZ3Jlc3MpKSk7XG5cbiAgICAgIGNvbnN0IHIgPSByYW5kb20oKTtcbiAgICAgIGlmIChyIDwgMC40KSB0cnlBc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC41NSkgdHJ5VW5hc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC44NSkgdHJ5UmVpbnNlcnRTYW1wbGVkKCk7XG4gICAgICBlbHNlIHRyeVJlbG9jYXRlU2FtcGxlZCgpO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVzdWx0KCkge1xuICAgIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgd2FybXVwLmVsYXBzZWRNcyArIChEYXRlLm5vdygpIC0gc2Vzc2lvblN0YXJ0ZWRBdCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpdGVyYXRlU3RlcHMoc3RlcHMpIHtcbiAgICAgIHJ1bkl0ZXJhdGlvbnMoc3RlcHMpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gICAgaXRlcmF0ZUZvck1zKGJ1ZGdldE1zKSB7XG4gICAgICBydW5UaW1lZENodW5rKGJ1ZGdldE1zKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGdldFJlc3VsdCxcbiAgICByZWhlYXQoZmFjdG9yID0gMSkge1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXAsIHJlaGVhdFRlbXAgKiBmYWN0b3IpO1xuICAgICAgLy8gUHVsbCB0aGUgc2VhcmNoIHNsaWdodGx5IGJhY2sgZnJvbSB0aGUgY29sZCBlbmQgb2YgdGhlIHNjaGVkdWxlLlxuICAgICAgaSA9IE1hdGgubWF4KDAsIGkgLSBNYXRoLmZsb29yKHRhcmdldFN0ZXBzICogMC4wOCAqIGZhY3RvcikpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2Q6IE1vZHVsZSwgb3B0aW9uczogSW1wcm92ZWRPcHRpb25zKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3QgdGFyZ2V0U3RlcHMgPSBvcHRpb25zLnN0ZXBzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLnN0ZXBzIDogTWF0aC5tYXgoMTUwMDAwLCBNYXRoLmZsb29yKG9wdGlvbnMuYnVkZ2V0TXMgKiAxOTApKTtcbiAgY29uc3Qgc2Vzc2lvbiA9IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbihtb2QsIHRhcmdldFN0ZXBzKTtcbiAgaWYgKG9wdGlvbnMuc3RlcHMgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZVN0ZXBzKG9wdGlvbnMuc3RlcHMpO1xuICByZXR1cm4gc2Vzc2lvbi5pdGVyYXRlRm9yTXMob3B0aW9ucy5idWRnZXRNcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZyhtb2Q6IE1vZHVsZSwgc3RlcHMgPSAxNTAwMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4gaW1wcm92ZWRBbm5lYWxpbmdDb3JlKG1vZCwgeyBzdGVwcyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nVGltZWQobW9kOiBNb2R1bGUsIGJ1ZGdldE1zID0gMTAwMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4gaW1wcm92ZWRBbm5lYWxpbmdDb3JlKG1vZCwgeyBidWRnZXRNcyB9KTtcbn1cbiIsCiAgICAiXG5leHBvcnQgdHlwZSBOdW1UeXBlID0gXCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIlxuZXhwb3J0IHR5cGUgUmVzdWx0VHlwZSA9IE51bVR5cGUgfCBcInZvaWRcIiB8IFN0cnVjdFR5cGU8YW55PlxuZXhwb3J0IHR5cGUgSW50VHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiXG5leHBvcnQgdHlwZSBQYWNrZWRUeXBlID0gXCJpOFwiIHwgXCJ1OFwiIHwgXCJpMTZcIiB8IFwidTE2XCJcbmV4cG9ydCB0eXBlIE1lbW9yeVR5cGUgPSBOdW1UeXBlIHwgUGFja2VkVHlwZVxuZXhwb3J0IHR5cGUgRFR5cGUgPSBNZW1vcnlUeXBlIHwgU3RydWN0VHlwZTxhbnk+XG5leHBvcnQgdHlwZSBMb2FkZWRUeXBlPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPiA9IFQgZXh0ZW5kcyBQYWNrZWRUeXBlID8gXCJpMzJcIiA6IFRcbmV4cG9ydCB0eXBlIEFyaXRobWV0aWNPcCA9IFwiYWRkXCIgfCBcInN1YlwiIHwgXCJtdWxcIiB8IFwiZGl2XCJcbmV4cG9ydCB0eXBlIEJpdE9wID0gXCJ4b3JcIiB8IFwic2hsXCIgfCBcInNoclwiIHwgXCJhbmRcIiB8IFwib3JcIlxuZXhwb3J0IHR5cGUgUmVtYWluZGVyT3AgPSBcIm1vZFwiIHwgXCJ1bW9kXCJcbmV4cG9ydCB0eXBlIEJpbk9wID0gQXJpdGhtZXRpY09wIHwgQml0T3AgfCBSZW1haW5kZXJPcFxuZXhwb3J0IHR5cGUgQ21wT3AgPSBcImVxXCIgfCBcImx0XCIgfCBcImd0XCJcbmNvbnN0IGFyaXRobWV0aWNPcHMgPSBbXCJhZGRcIiwgXCJzdWJcIiwgXCJtdWxcIiwgXCJkaXZcIl0gYXMgY29uc3RcbmNvbnN0IGJpdE9wcyA9IFtcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwic2hyXCJdIGFzIGNvbnN0XG5jb25zdCByZW1haW5kZXJPcHMgPSBbXCJtb2RcIiwgXCJ1bW9kXCJdIGFzIGNvbnN0XG5jb25zdCBjbXBPcHMgPSBbXCJlcVwiLCBcImx0XCIsIFwiZ3RcIl0gYXMgY29uc3RcbmV4cG9ydCB0eXBlIFZhbHVlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IFQgZXh0ZW5kcyBcImk2NFwiID8gYmlnaW50IDogbnVtYmVyXG5leHBvcnQgdHlwZSBUeXBlZEFycmF5Rm9yPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPiA9XG4gIFQgZXh0ZW5kcyBcImk4XCIgPyBJbnQ4QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJ1MTZcIiA/IFVpbnQxNkFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTE2XCIgPyBJbnQxNkFycmF5IDpcbiAgVCBleHRlbmRzIFwidThcIiA/IFVpbnQ4QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpMzJcIiA/IEludDMyQXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpNjRcIiA/IEJpZ0ludDY0QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJmMzJcIiA/IEZsb2F0MzJBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImY2NFwiID8gRmxvYXQ2NEFycmF5IDogbmV2ZXJcblxudHlwZSBBcmdzRXhwcjxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxBcmdzW0tdPjogbmV2ZXIgfVxudHlwZSBBcmdzTGlrZTxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwckxpa2U8QXJnc1tLXT46IG5ldmVyIH1cbmV4cG9ydCB0eXBlIEFyZ3NWYWw8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gID0geyBbSyBpbiBrZXlvZiBBcmdzXTogQXJnc1tLXSBleHRlbmRzIE51bVR5cGUgPyBWYWx1ZTxBcmdzW0tdPiA6IG5ldmVyIH1cbnR5cGUgRm5SZXR1cm48UiBleHRlbmRzIFJlc3VsdFR5cGU+ID1cbiAgUiBleHRlbmRzIE51bVR5cGUgPyBFeHByPFI+IHwgdm9pZCA6XG4gIFIgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gU3RydWN0VmFsdWU8Rj4gfCB2b2lkIDpcbiAgdm9pZFxuXG50eXBlIExvY2FsTm9kZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGU6IFQsIGxvY2FsOiBudW1iZXIgfVxudHlwZSBHbG9iYWxOb2RlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsga2luZDogXCJnbG9iYWwuZ2V0XCIsIHR5cGU6IFQsIGluaXRpYWw6IFZhbHVlPFQ+IH1cbmV4cG9ydCB0eXBlIENvcmVFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9XG4gIHwgeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFQsIHZhbHVlOiBWYWx1ZTxUPiB9XG4gIHwgTG9jYWxOb2RlPFQ+XG4gIHwgR2xvYmFsTm9kZTxUPlxuICB8IHsga2luZDogXCJiaW5cIiwgdHlwZTogVCwgb3A6IEJpbk9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImNhbGxcIiwgdHlwZTogVCwgdGFyZ2V0OiBBbnlGdW5jLCBhcmdzOiBFeHByPE51bVR5cGU+W10gfVxuICB8IHsga2luZDogXCJjYXN0XCIsIHR5cGU6IFQsIGlucHV0VHlwZTogTnVtVHlwZSwgdW5zaWduZWQ6IGJvb2xlYW4sIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiaWZcIiwgdHlwZTogVCwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZTogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImxvYWRcIiwgdHlwZTogVCwgYXJyYXk6IEFueUFycmF5LCBpbmRleDogRXhwcjxcImkzMlwiPiwgc3RvcmFnZTogTWVtb3J5VHlwZSwgc3RyaWRlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyIH1cbiAgfCAoVCBleHRlbmRzIFwiaTMyXCIgPyB7IGtpbmQ6IFwiY21wXCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogTnVtVHlwZSwgb3A6IENtcE9wLCBsZWZ0OiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwcjxOdW1UeXBlPiB9IDogbmV2ZXIpXG5cbmNsYXNzIEV4cHJNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiB7fVxudHlwZSBBcml0aG1ldGljTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBBcml0aG1ldGljT3BdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbnR5cGUgQ29tcGFyZU1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+ID0geyBbT3AgaW4gQ21wT3BdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFwiaTMyXCI+IH1cbnR5cGUgSW50ZWdlck1ldGhvZHM8VCBleHRlbmRzIEludFR5cGU+ID0geyBbT3AgaW4gQml0T3AgfCBSZW1haW5kZXJPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuZXhwb3J0IHR5cGUgRXhwcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSBDb3JlRXhwcjxUPiAmIEV4cHJNZXRob2RzPFQ+ICYgQXJpdGhtZXRpY01ldGhvZHM8VD4gJiBDb21wYXJlTWV0aG9kczxUPiAmIChUIGV4dGVuZHMgSW50VHlwZSA/IEludGVnZXJNZXRob2RzPFQ+IDoge30pXG5leHBvcnQgdHlwZSBBbnlFeHByID0gYW55XG5cblxuZXhwb3J0IHR5cGUgU3RtdCA9XG4gIHwgeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbDogbnVtYmVyLCB0eXBlOiBOdW1UeXBlLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImdsb2JhbC5zZXRcIiwgZ2xvYmFsOiBBbnlHbG9iYWwsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXk6IEFueUFycmF5LCB0eXBlOiBNZW1vcnlUeXBlLCBpbmRleDogRXhwcjxcImkzMlwiPiwgc3RyaWRlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImFycmF5Lm1vdmVcIiwgYXJyYXk6IEFueUFycmF5LCB0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4gfVxuICB8IHsga2luZDogXCJpZlwiLCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10W10sIGVsc2U6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImxvb3BcIiwgY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwiZm9yXCIsIGxvY2FsOiBudW1iZXIsIHN0YXJ0OiBFeHByPFwiaTMyXCI+LCBlbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcInJldHVyblwiLCB2YWx1ZT86IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJjYWxsLnZvaWRcIiwgdGFyZ2V0OiBBbnlGdW5jLCBhcmdzOiBFeHByPE51bVR5cGU+W10gfVxuICB8IHsga2luZDogXCJ0cmFwXCIsIG1lc3NhZ2U6IHN0cmluZyB9XG4gIHwgeyBraW5kOiBcImxvZ1wiLCBtZXNzYWdlOiBzdHJpbmcsIHZhbHVlOiBFeHByPFwiaTMyXCI+IH1cblxuY2xhc3MgTXV0YWJsZU1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IGV4dGVuZHMgRXhwck1ldGhvZHM8VD4ge1xuICBkZWNsYXJlIHR5cGU6IFRcbiAgZGVjbGFyZSB3cml0ZTogKHZhbHVlOiBFeHByPFQ+KSA9PiBTdG10IHwgdm9pZFxuICBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KTogdm9pZCB7XG4gICAgY29uc3Qgc3RhdGVtZW50ID0gdGhpcy53cml0ZShsaXQodGhpcy50eXBlLCB2YWx1ZSkpXG4gICAgaWYgKHN0YXRlbWVudCkgZW1pdChzdGF0ZW1lbnQpXG4gIH1cbn1cbnR5cGUgTXV0YWJsZUFyaXRobWV0aWM8VCBleHRlbmRzIE51bVR5cGU+ID0geyBbT3AgaW4gQXJpdGhtZXRpY09wIGFzIGBpJHtPcH1gXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gdm9pZCB9XG50eXBlIE11dGFibGVJbnRlZ2VyPFQgZXh0ZW5kcyBJbnRUeXBlPiA9IHsgW09wIGluIFwiYW5kXCIgfCBcIm9yXCIgfCBcInhvclwiIGFzIGBpJHtPcH1gXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gdm9pZCB9XG5leHBvcnQgdHlwZSBNdXRhYmxlVmFsdWU8VCBleHRlbmRzIE51bVR5cGU+ID0gRXhwcjxUPiAmIHsgc2V0KHZhbHVlOiBFeHByTGlrZTxUPik6IHZvaWQgfSAmIE11dGFibGVBcml0aG1ldGljPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gTXV0YWJsZUludGVnZXI8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIExvY2FsVmFyPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IE11dGFibGVWYWx1ZTxUPiAmIExvY2FsTm9kZTxUPlxuZXhwb3J0IHR5cGUgR2xvYmFsVmFsdWU8VCBleHRlbmRzIE51bVR5cGU+ID0gTXV0YWJsZVZhbHVlPFQ+ICYgR2xvYmFsTm9kZTxUPlxuZXhwb3J0IHR5cGUgQW55R2xvYmFsID0gR2xvYmFsVmFsdWU8TnVtVHlwZT5cblxuZXhwb3J0IHR5cGUgQXJyYXlWYWx1ZTxUIGV4dGVuZHMgRFR5cGU+ID1cbiAgVCBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBNdXRhYmxlU3RydWN0PEY+IDpcbiAgVCBleHRlbmRzIE1lbW9yeVR5cGUgPyBNdXRhYmxlVmFsdWU8TG9hZGVkVHlwZTxUPj4gOiBuZXZlclxuZXhwb3J0IHR5cGUgQXJyYXlIYW5kbGU8VCBleHRlbmRzIERUeXBlPiA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IFRcbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBBcnJheVZhbHVlPFQ+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogdm9pZFxufVxuXG5leHBvcnQgdHlwZSBCaXRTdG9yYWdlVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiIHwgXCJpMzJcIlxuZXhwb3J0IHR5cGUgQml0RmllbGQgPSByZWFkb25seSBbQml0U3RvcmFnZVR5cGUsIG51bWJlcl1cbmV4cG9ydCB0eXBlIFN0cnVjdFN0b3JhZ2VUeXBlID0gUGFja2VkVHlwZSB8IEludFR5cGVcbmV4cG9ydCB0eXBlIEZpZWxkVHlwZSA9IFN0cnVjdFN0b3JhZ2VUeXBlIHwgQml0RmllbGRcbmV4cG9ydCB0eXBlIFN0cnVjdEZpZWxkcyA9IFJlY29yZDxzdHJpbmcsIEZpZWxkVHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkU3RvcmFnZTxUIGV4dGVuZHMgRmllbGRUeXBlPiA9IFQgZXh0ZW5kcyByZWFkb25seSBbaW5mZXIgUyBleHRlbmRzIEJpdFN0b3JhZ2VUeXBlLCBudW1iZXJdID8gUyA6IEV4dHJhY3Q8VCwgTWVtb3J5VHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkVmFsdWU8VCBleHRlbmRzIEZpZWxkVHlwZT4gPSBMb2FkZWRUeXBlPEZpZWxkU3RvcmFnZTxUPj5cbmV4cG9ydCB0eXBlIEZpZWxkTGF5b3V0ID0geyBzdG9yYWdlOiBTdHJ1Y3RTdG9yYWdlVHlwZSwgYml0T2Zmc2V0OiBudW1iZXIsIGJpdHM6IG51bWJlciB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RUeXBlPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBraW5kOiBcInN0cnVjdFwiXG4gIGZpZWxkczogRlxuICBsYXlvdXQ6IHsgW0sgaW4ga2V5b2YgRl06IEZpZWxkTGF5b3V0IH1cbiAgc2l6ZTogbnVtYmVyXG4gIHN0b3JhZ2U6IFwidThcIiB8IFwidTE2XCIgfCBJbnRUeXBlXG59XG50eXBlIFN0cnVjdE1lbWJlcnM8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7XG4gIFtLIGluIGtleW9mIEZdOiBFeHByPEZpZWxkVmFsdWU8RltLXT4+XG59XG50eXBlIE11dGFibGVTdHJ1Y3RNZW1iZXJzPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBbSyBpbiBrZXlvZiBGXTogTXV0YWJsZVZhbHVlPEZpZWxkVmFsdWU8RltLXT4+XG59XG5leHBvcnQgdHlwZSBTdHJ1Y3RJbml0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0geyBbSyBpbiBrZXlvZiBGXTogRXhwckxpa2U8RmllbGRWYWx1ZTxGW0tdPj4gfVxuZXhwb3J0IHR5cGUgSlNTdHJ1Y3Q8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7IFtLIGluIGtleW9mIEZdOiBWYWx1ZTxGaWVsZFZhbHVlPEZbS10+PiB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RWYWx1ZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IFN0cnVjdE1lbWJlcnM8Rj4gJiB7IHBhY2tlZDogQW55RXhwciwgc3RydWN0VHlwZTogU3RydWN0VHlwZTxGPiB9XG5leHBvcnQgdHlwZSBNdXRhYmxlU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0gU3RydWN0VmFsdWU8Rj4gJiBNdXRhYmxlU3RydWN0TWVtYmVyczxGPiAmIHtcbiAgc2V0KHZhbHVlOiBNdXRhYmxlU3RydWN0PEY+IHwgU3RydWN0SW5pdDxGPik6IHZvaWRcbn1cbmV4cG9ydCB0eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPlxuZXhwb3J0IHR5cGUgRnVuY0hhbmRsZTxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4gPSB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIHBhcmFtczogQVxuICByZXN1bHQ6IFJcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IFN0bXRbXVxuICBjYWxsOiAoLi4uYXJnczogQXJnc0xpa2U8QT4pID0+XG4gICAgUiBleHRlbmRzIE51bVR5cGUgPyBFeHByPFI+IDpcbiAgICBSIGV4dGVuZHMgU3RydWN0VHlwZTxpbmZlciBGPiA/IFN0cnVjdFZhbHVlPEY+IDpcbiAgICB2b2lkXG59XG5cbmV4cG9ydCB0eXBlIEFueUZ1bmMgPSB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIHBhcmFtczogcmVhZG9ubHkgTnVtVHlwZVtdXG4gIHJlc3VsdDogUmVzdWx0VHlwZVxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEFueUV4cHJbXSkgPT4gU3RtdFtdXG4gIGNhbGw6ICguLi5hcmdzOiBhbnlbXSkgPT4gQW55RXhwclxufVxuXG5leHBvcnQgdHlwZSBBbnlBcnJheSA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IERUeXBlXG4gIGxlbmd0aDogbnVtYmVyXG4gIGVsZW1lbnRTaXplOiBudW1iZXJcbiAgYXQoLi4uYXJnczogYW55W10pOiBhbnlcbiAgbW92ZSguLi5hcmdzOiBhbnlbXSk6IHZvaWRcbn1cblxuZXhwb3J0IHR5cGUgTW9kdWxlRGVmID0gUmVjb3JkPHN0cmluZywgQW55RnVuYyB8IEFueUFycmF5IHwgQW55R2xvYmFsPlxuZXhwb3J0IHR5cGUgRnVuY0RlZnM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7IFtLIGluIGtleW9mIFQgYXMgVFtLXSBleHRlbmRzIEFueUZ1bmMgPyBLIDogbmV2ZXJdOiBFeHRyYWN0PFRbS10sIEFueUZ1bmM+IH1cbmV4cG9ydCB0eXBlIEFycmF5RGVmczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHsgW0sgaW4ga2V5b2YgVCBhcyBUW0tdIGV4dGVuZHMgQW55QXJyYXkgPyBLIDogbmV2ZXJdOiBFeHRyYWN0PFRbS10sIEFueUFycmF5PiB9XG5leHBvcnQgdHlwZSBDb21waWxlUmVzdWx0PFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0ge1xuICBbSyBpbiBrZXlvZiBUXTpcbiAgICBUW0tdIGV4dGVuZHMgQW55RnVuYyA/ICguLi5hcmdzOiBBcmdzVmFsPFRbS11bXCJwYXJhbXNcIl0+KSA9PlxuICAgICAgVFtLXVtcInJlc3VsdFwiXSBleHRlbmRzIE51bVR5cGUgPyBWYWx1ZTxUW0tdW1wicmVzdWx0XCJdPiA6XG4gICAgICBUW0tdW1wicmVzdWx0XCJdIGV4dGVuZHMgU3RydWN0VHlwZTxpbmZlciBGPiA/IEpTU3RydWN0PEY+IDpcbiAgICAgIHZvaWRcbiAgICA6IFRbS10gZXh0ZW5kcyBBcnJheUhhbmRsZTxpbmZlciBEPiA/XG4gICAgICBEIGV4dGVuZHMgTWVtb3J5VHlwZSA/IFR5cGVkQXJyYXlGb3I8RD4gOiBVaW50OEFycmF5IHwgVWludDE2QXJyYXkgfCBVaW50MzJBcnJheSB8IEJpZ1VpbnQ2NEFycmF5XG4gICAgOiBuZXZlclxufSAmIHtcbiAgbW9kOiBXZWJBc3NlbWJseS5Nb2R1bGVcbiAgbWVtb3J5OiBXZWJBc3NlbWJseS5NZW1vcnlcbiAgdHJhcE1lc3NhZ2VzOiBzdHJpbmdbXVxuICBsb2dNZXNzYWdlczogc3RyaW5nW11cbiAgcmVzdWx0U3RydWN0czogUmVjb3JkPHN0cmluZywgU3RydWN0VHlwZTxhbnk+PlxufVxuXG5cbmxldCBuZXh0TG9jYWxJZCA9IDBcbmNvbnN0IHJlY29yZGluZ1N0YWNrOiBTdG10W11bXSA9IFtdXG5sZXQgcmVjb3JkaW5nUGF1c2VkID0gMFxuXG5jb25zdCByZWNvcmRpbmcgPSAoKSA9PiByZWNvcmRpbmdQYXVzZWQgPyB1bmRlZmluZWQgOiByZWNvcmRpbmdTdGFjay5hdCgtMSlcbmNvbnN0IGVtaXQgPSA8UyBleHRlbmRzIFN0bXQ+KHN0YXRlbWVudDogUyk6IFMgPT4ge1xuICByZWNvcmRpbmcoKT8ucHVzaChzdGF0ZW1lbnQpXG4gIHJldHVybiBzdGF0ZW1lbnRcbn1cbmNvbnN0IGNhcHR1cmUgPSAoYnVpbGQ6ICgpID0+IHZvaWQpOiBTdG10W10gPT4ge1xuICBjb25zdCBzdGF0ZW1lbnRzOiBTdG10W10gPSBbXVxuICByZWNvcmRpbmdTdGFjay5wdXNoKHN0YXRlbWVudHMpXG4gIHRyeSB7IGJ1aWxkKCkgfSBmaW5hbGx5IHsgcmVjb3JkaW5nU3RhY2sucG9wKCkgfVxuICByZXR1cm4gc3RhdGVtZW50c1xufVxuY29uc3Qgd2l0aG91dFJlY29yZGluZyA9IDxUPihidWlsZDogKCkgPT4gVCk6IFQgPT4ge1xuICByZWNvcmRpbmdQYXVzZWQrK1xuICB0cnkgeyByZXR1cm4gYnVpbGQoKSB9IGZpbmFsbHkgeyByZWNvcmRpbmdQYXVzZWQtLSB9XG59XG5cbmNvbnN0IGluZmVyVHlwZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHJMaWtlPFQ+KSA9PlxuICAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIFwidHlwZVwiIGluIHZhbHVlID8gdmFsdWUudHlwZSA6IFwiaTMyXCIpIGFzIFRcblxuY29uc3QgZXhwciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obm9kZTogQ29yZUV4cHI8VD4pOiBFeHByPFQ+ID0+IHtcbiAgcmV0dXJuIE9iamVjdC5zZXRQcm90b3R5cGVPZihub2RlLCBFeHByTWV0aG9kcy5wcm90b3R5cGUpIGFzIEV4cHI8VD5cbn1cblxuZXhwb3J0IGNvbnN0IGxpdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPiA9PiB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoXCJraW5kXCIgaW4gdmFsdWUpIHJldHVybiB2YWx1ZSBhcyBFeHByPFQ+XG4gIH1cbiAgcmV0dXJuIGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGUsIHZhbHVlOiB2YWx1ZSBhcyBWYWx1ZTxUPiB9KVxufVxuY29uc3QgbXV0YWJsZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obm9kZTogQ29yZUV4cHI8VD4sIHdyaXRlOiAodmFsdWU6IEV4cHI8VD4pID0+IFN0bXQgfCB2b2lkKSA9PlxuICBPYmplY3QuYXNzaWduKE9iamVjdC5zZXRQcm90b3R5cGVPZihub2RlLCBNdXRhYmxlTWV0aG9kcy5wcm90b3R5cGUpLCB7IHdyaXRlIH0pIGFzIE11dGFibGVWYWx1ZTxUPlxuXG5jb25zdCBiaW4gPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBBcml0aG1ldGljT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT5cbiAgcmVjb3JkRXhwcihleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KSlcblxuY29uc3QgYml0ID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihvcDogQml0T3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT5cbiAgcmVjb3JkRXhwcihleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KSlcblxuY29uc3QgcmVtYWluZGVyID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihvcDogUmVtYWluZGVyT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT5cbiAgcmVjb3JkRXhwcihleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KSlcblxuY29uc3QgY21wID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQ21wT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj4gPT5cbiAgcmVjb3JkRXhwcihleHByPFwiaTMyXCI+KHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0OiBsZWZ0IGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiB9IGFzIENvcmVFeHByPFwiaTMyXCI+KSlcblxuZXhwb3J0IGNvbnN0IGFsbG9jYXRlTG9jYWwgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpID0+IGV4cHIoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbDogbmV4dExvY2FsSWQrKyB9KVxuXG5jb25zdCBta0xvY2FsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKTogTG9jYWxWYXI8VD4gPT4ge1xuICBjb25zdCBsb2NhbCA9IG5leHRMb2NhbElkKytcbiAgcmV0dXJuIG11dGFibGUoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbCB9LCB2YWx1ZSA9PiAoeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbCwgdHlwZSwgdmFsdWU6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSkpIGFzIExvY2FsVmFyPFQ+XG59XG5cbi8vIEluIHJlY29yZGVkIGZ1bmN0aW9ucywgY29uc3RydWN0aW5nIGEgY29tcHV0YXRpb24gZml4ZXMgaXRzIHZhbHVlIGF0IHRoYXRcbi8vIHBvaW50IGluIHRoZSBmbG93LiBUaGUgbG9jYWwgaXMgY29tcGlsZXIgSVI7IGF1dGhvcnMgb25seSBrZWVwIHRoZSByZXR1cm5lZFxuLy8gZXhwcmVzc2lvbiBpbiBhbiBvcmRpbmFyeSBKUyB2YXJpYWJsZS5cbmNvbnN0IHJlY29yZEV4cHIgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxUPiA9PiB7XG4gIGlmICghcmVjb3JkaW5nKCkpIHJldHVybiB2YWx1ZVxuICBjb25zdCBzbmFwc2hvdCA9IG1rTG9jYWw8VD4odmFsdWUudHlwZSBhcyBUKVxuICBzbmFwc2hvdC5zZXQodmFsdWUpXG4gIHJldHVybiBzbmFwc2hvdFxufVxuXG5jb25zdCBta0hhbmRsZSA9IDxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4oXG4gIHBhcmFtczogQSxcbiAgcmVzdWx0OiBSLFxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gU3RtdFtdLFxuKTogRnVuY0hhbmRsZTxBLCBSPiA9PiB7XG4gIGxldCBoYW5kbGUhOiBGdW5jSGFuZGxlPEEsIFI+XG4gIGhhbmRsZSA9IHtcbiAgICBraW5kOiBcImZ1bmNcIixcbiAgICBwYXJhbXMsIHJlc3VsdCwgYnVpbGQsXG4gICAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NMaWtlPEE+KSA9PiB7XG4gICAgICBjb25zdCBjYWxsQXJncyA9IHBhcmFtcy5tYXAoKHR5cGUsIGkpID0+IGxpdCh0eXBlLCBhcmdzW2ldIGFzIEV4cHJMaWtlPHR5cGVvZiB0eXBlPikpIGFzIEV4cHI8TnVtVHlwZT5bXVxuICAgICAgaWYgKHJlc3VsdCA9PT0gXCJ2b2lkXCIpIHJldHVybiBlbWl0KHsga2luZDogXCJjYWxsLnZvaWRcIiwgdGFyZ2V0OiBoYW5kbGUsIGFyZ3M6IGNhbGxBcmdzIH0pXG4gICAgICBjb25zdCB0eXBlID0gKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIgPyByZXN1bHQgOiByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiKSBhcyBOdW1UeXBlXG4gICAgICBjb25zdCBjYWxsID0gcmVjb3JkRXhwcihleHByKHsga2luZDogXCJjYWxsXCIsIHR5cGUsIHRhcmdldDogaGFuZGxlLCBhcmdzOiBjYWxsQXJncyB9KSlcbiAgICAgIHJldHVybiB0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiID8gY2FsbCA6IHJlYWRTdHJ1Y3QocmVzdWx0LCBjYWxsKVxuICAgIH0sXG4gIH0gYXMgRnVuY0hhbmRsZTxBLCBSPlxuICByZXR1cm4gaGFuZGxlXG59XG5cbmNvbnN0IGxvYWRlZFR5cGUgPSA8VCBleHRlbmRzIE1lbW9yeVR5cGU+KHR5cGU6IFQpID0+XG4gICh0eXBlID09PSBcImk4XCIgfHwgdHlwZSA9PT0gXCJ1OFwiIHx8IHR5cGUgPT09IFwiaTE2XCIgfHwgdHlwZSA9PT0gXCJ1MTZcIiA/IFwiaTMyXCIgOiB0eXBlKSBhcyBMb2FkZWRUeXBlPFQ+XG5cbmNvbnN0IHN0b3JhZ2VTaXplOiBSZWNvcmQ8TWVtb3J5VHlwZSwgbnVtYmVyPiA9IHsgaTg6IDEsIHU4OiAxLCBpMTY6IDIsIHUxNjogMiwgaTMyOiA0LCBmMzI6IDQsIGk2NDogOCwgZjY0OiA4IH1cbmNvbnN0IG1lbW9yeVZhbHVlID0gPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPihhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgc3RvcmFnZTogVCwgc3RyaWRlOiBudW1iZXIsIG9mZnNldCA9IDApID0+IHtcbiAgY29uc3QgYXQgPSBsaXQoXCJpMzJcIiwgaW5kZXgpXG4gIHJldHVybiBtdXRhYmxlKHsga2luZDogXCJsb2FkXCIsIHR5cGU6IGxvYWRlZFR5cGUoc3RvcmFnZSksIGFycmF5LCBpbmRleDogYXQsIHN0b3JhZ2UsIHN0cmlkZSwgb2Zmc2V0IH0sIHZhbHVlID0+XG4gICAgKHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheSwgdHlwZTogc3RvcmFnZSwgaW5kZXg6IGF0LCBzdHJpZGUsIG9mZnNldCwgdmFsdWU6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSkpXG59XG5cbnR5cGUgU3RydWN0QmFja2luZyA9IGFueVxudHlwZSBJbnRlcm5hbFN0cnVjdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IE11dGFibGVTdHJ1Y3Q8Rj4gJiB7IHBhY2tlZDogU3RydWN0QmFja2luZyB9XG5cbmNvbnN0IHJlYWRGaWVsZCA9IChiYWNraW5nOiBBbnlFeHByLCBmaWVsZDogRmllbGRMYXlvdXQpID0+IHtcbiAgY29uc3QgeyBiaXRzIH0gPSBmaWVsZFxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIikgcmV0dXJuIGJhY2tpbmdcbiAgaWYgKGJhY2tpbmcudHlwZSA9PT0gXCJpNjRcIikge1xuICAgIGNvbnN0IGJpdE9mZnNldCA9IEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpLCBtYXNrID0gKDFuIDw8IEJpZ0ludChiaXRzKSkgLSAxblxuICAgIGNvbnN0IHJhdyA9IGkzMihiYWNraW5nLnNocihiaXRPZmZzZXQpLmFuZChtYXNrKSlcbiAgICByZXR1cm4gZmllbGQuc3RvcmFnZS5zdGFydHNXaXRoKFwiaVwiKSAmJiBiaXRzIDwgMzJcbiAgICAgID8gaWZFbHNlKHJhdy5hbmQoMiAqKiAoYml0cyAtIDEpKSwgcmF3LnN1YigyICoqIGJpdHMpLCByYXcpXG4gICAgICA6IHJhd1xuICB9XG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImkzMlwiICYmIGZpZWxkLmJpdE9mZnNldCA9PT0gMCkgcmV0dXJuIGJhY2tpbmdcbiAgY29uc3QgbWFzayA9IDIgKiogYml0cyAtIDFcbiAgY29uc3QgcmF3ID0gYmFja2luZy5zaHIoZmllbGQuYml0T2Zmc2V0KS5hbmQobWFzaylcbiAgcmV0dXJuIGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgYml0cyA8IDMyXG4gICAgPyBpZkVsc2UocmF3LmFuZCgyICoqIChiaXRzIC0gMSkpLCByYXcuc3ViKDIgKiogYml0cyksIHJhdylcbiAgICA6IHJhd1xufVxuXG5jb25zdCBwYWNrZWRGaWVsZFZhbHVlID0gKGJhY2tpbmc6IFN0cnVjdEJhY2tpbmcsIGZpZWxkOiBGaWVsZExheW91dCkgPT4ge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRGaWVsZChiYWNraW5nLCBmaWVsZClcbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBiYWNraW5nXG4gIGlmIChiYWNraW5nLnR5cGUgPT09IFwiaTY0XCIpIHtcbiAgICBjb25zdCBiaXRPZmZzZXQgPSBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSwgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICBjb25zdCBmaWVsZE1hc2sgPSBtYXNrIDw8IGJpdE9mZnNldFxuICAgIHJldHVybiBtdXRhYmxlPFwiaTMyXCI+KHZhbHVlIGFzIEV4cHI8XCJpMzJcIj4sIGlucHV0ID0+IGJhY2tpbmcuc2V0KGJhY2tpbmcuYW5kKH5maWVsZE1hc2spLm9yKGk2NHUoaW5wdXQpLmFuZChtYXNrKS5zaGwoYml0T2Zmc2V0KSkpKVxuICB9XG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImkzMlwiICYmIGZpZWxkLmJpdE9mZnNldCA9PT0gMCkgcmV0dXJuIGJhY2tpbmdcbiAgY29uc3QgbWFzayA9IDIgKiogZmllbGQuYml0cyAtIDEsIGZpZWxkTWFzayA9IG1hc2sgPDwgZmllbGQuYml0T2Zmc2V0XG4gIHJldHVybiBtdXRhYmxlPFwiaTMyXCI+KHZhbHVlLCBpbnB1dCA9PiBiYWNraW5nLnNldChiYWNraW5nLmFuZCh+ZmllbGRNYXNrKS5vcihpbnB1dC5hbmQobWFzaykuc2hsKGZpZWxkLmJpdE9mZnNldCkpKSlcbn1cblxuY29uc3QgcmVhZFN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCBwYWNrZWQ6IEFueUV4cHIpOiBTdHJ1Y3RWYWx1ZTxGPiA9PlxuICB3aXRob3V0UmVjb3JkaW5nKCgpID0+IE9iamVjdC5hc3NpZ24oT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5tYXAobmFtZSA9PiBbbmFtZSwgcmVhZEZpZWxkKHBhY2tlZCwgdHlwZS5sYXlvdXRbbmFtZV0hKV0pKSwgeyBwYWNrZWQsIHN0cnVjdFR5cGU6IHR5cGUgfSkpIGFzIFN0cnVjdFZhbHVlPEY+XG5cbmNvbnN0IHN0cnVjdFZhbHVlID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHBhY2tlZDogU3RydWN0QmFja2luZyk6IE11dGFibGVTdHJ1Y3Q8Rj4gPT4ge1xuICBjb25zdCBmaWVsZHMgPSB3aXRob3V0UmVjb3JkaW5nKCgpID0+IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykubWFwKG5hbWUgPT4gW25hbWUsIHBhY2tlZEZpZWxkVmFsdWUocGFja2VkLCB0eXBlLmxheW91dFtuYW1lXSEpIF0pKSlcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oZmllbGRzLCB7IHBhY2tlZCwgc3RydWN0VHlwZTogdHlwZSwgc2V0OiAodmFsdWU6IE11dGFibGVTdHJ1Y3Q8Rj4gfCBTdHJ1Y3RJbml0PEY+KSA9PlxuICAgIHBhY2tlZC5zZXQoXCJwYWNrZWRcIiBpbiB2YWx1ZSA/ICh2YWx1ZSBhcyBJbnRlcm5hbFN0cnVjdDxGPikucGFja2VkIDogcGFja1N0cnVjdCh0eXBlLCB2YWx1ZSkpIH0pIGFzIEludGVybmFsU3RydWN0PEY+XG59XG5cbmNvbnN0IHBhY2tTdHJ1Y3QgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgdmFsdWVzOiBTdHJ1Y3RJbml0PEY+KTogQW55RXhwciA9PiB7XG4gIGlmICh0eXBlLnN0b3JhZ2UgIT09IFwiaTY0XCIpIHJldHVybiBPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykucmVkdWNlKChwYWNrZWQsIG5hbWUpID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IHR5cGUubGF5b3V0W25hbWVdISwgdmFsdWUgPSB2YWx1ZXNbbmFtZV0hXG4gICAgY29uc3QgbWFzayA9IDIgKiogZmllbGQuYml0cyAtIDFcbiAgICByZXR1cm4gcGFja2VkLm9yKGxpdChcImkzMlwiLCB2YWx1ZSBhcyBFeHByTGlrZTxcImkzMlwiPikuYW5kKG1hc2spLnNobChmaWVsZC5iaXRPZmZzZXQpKVxuICB9LCBpMzIoMCkpXG4gIHJldHVybiBPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykucmVkdWNlKChwYWNrZWQsIG5hbWUpID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IHR5cGUubGF5b3V0W25hbWVdISwgdmFsdWUgPSB2YWx1ZXNbbmFtZV0hXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBsaXQoXCJpNjRcIiwgdmFsdWUgYXMgRXhwckxpa2U8XCJpNjRcIj4pXG4gICAgY29uc3QgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICByZXR1cm4gcGFja2VkLm9yKGk2NHUobGl0KFwiaTMyXCIsIHZhbHVlIGFzIEV4cHJMaWtlPFwiaTMyXCI+KSkuYW5kKG1hc2spLnNobChCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkpXG4gIH0sIGk2NCgwbikpXG59XG5cbmV4cG9ydCBjb25zdCBzdHJ1Y3QgPSA8Y29uc3QgRiBleHRlbmRzIFN0cnVjdEZpZWxkcz4oZmllbGRzOiBGKTogU3RydWN0VHlwZTxGPiA9PiB7XG4gIGlmIChcInNldFwiIGluIGZpZWxkcyB8fCBcInBhY2tlZFwiIGluIGZpZWxkcyB8fCBcInN0cnVjdFR5cGVcIiBpbiBmaWVsZHMpIHRocm93IG5ldyBFcnJvcihcIlN0cnVjdCBmaWVsZHMgY2Fubm90IGJlIG5hbWVkIHNldCwgcGFja2VkLCBvciBzdHJ1Y3RUeXBlXCIpXG4gIGxldCB1c2VkID0gMFxuICBjb25zdCBsYXlvdXQ6IFBhcnRpYWw8UmVjb3JkPGtleW9mIEYsIEZpZWxkTGF5b3V0Pj4gPSB7fVxuICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXMoZmllbGRzKSBhcyAoa2V5b2YgRilbXSkge1xuICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW25hbWVdIVxuICAgIGNvbnN0IHN0b3JhZ2UgPSAoQXJyYXkuaXNBcnJheShmaWVsZCkgPyBmaWVsZFswXSA6IGZpZWxkKSBhcyBTdHJ1Y3RTdG9yYWdlVHlwZVxuICAgIGNvbnN0IGJpdHMgPSBBcnJheS5pc0FycmF5KGZpZWxkKSA/IGZpZWxkWzFdIDogc3RvcmFnZVNpemVbc3RvcmFnZV0gKiA4XG4gICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGJpdHMpIHx8IGJpdHMgPCAxIHx8IGJpdHMgPiBzdG9yYWdlU2l6ZVtzdG9yYWdlXSAqIDgpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCAke3N0b3JhZ2V9IGJpdC1maWVsZCB3aWR0aCAke2JpdHN9YClcbiAgICBpZiAodXNlZCArIGJpdHMgPiA2NCkgdGhyb3cgbmV3IEVycm9yKGBTdHJ1Y3QgcmVxdWlyZXMgJHt1c2VkICsgYml0c30gYml0czsgbWF4aW11bSBpcyA2NGApXG4gICAgbGF5b3V0W25hbWVdID0geyBzdG9yYWdlLCBiaXRPZmZzZXQ6IHVzZWQsIGJpdHMgfVxuICAgIHVzZWQgKz0gYml0c1xuICB9XG4gIGNvbnN0IHN0b3JhZ2UgPSB1c2VkIDw9IDggPyBcInU4XCIgOiB1c2VkIDw9IDE2ID8gXCJ1MTZcIiA6IHVzZWQgPD0gMzIgPyBcImkzMlwiIDogXCJpNjRcIlxuICByZXR1cm4geyBraW5kOiBcInN0cnVjdFwiLCBmaWVsZHMsIGxheW91dDogbGF5b3V0IGFzIHsgW0sgaW4ga2V5b2YgRl06IEZpZWxkTGF5b3V0IH0sIHN0b3JhZ2UsIHNpemU6IHN0b3JhZ2VTaXplW3N0b3JhZ2VdIH1cbn1cblxuY29uc3QgY2FzdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IEV4cHI8TnVtVHlwZT4sIHVuc2lnbmVkID0gZmFsc2UpOiBFeHByPFQ+ID0+XG4gIHZhbHVlLnR5cGUgPT09IHR5cGUgPyB2YWx1ZSBhcyB1bmtub3duIGFzIEV4cHI8VD4gOiByZWNvcmRFeHByKGV4cHI8VD4oeyBraW5kOiBcImNhc3RcIiwgdHlwZSwgaW5wdXRUeXBlOiB2YWx1ZS50eXBlLCB1bnNpZ25lZCwgdmFsdWUgfSBhcyBDb3JlRXhwcjxUPikpXG5jb25zdCBudW1iZXIgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiB1bmtub3duKTogRXhwcjxUPiA9PlxuICB0eXBlb2YgdmFsdWUgPT09ICh0eXBlID09PSBcImk2NFwiID8gXCJiaWdpbnRcIiA6IFwibnVtYmVyXCIpXG4gICAgPyBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlLCB2YWx1ZSB9IGFzIENvcmVFeHByPFQ+KVxuICAgIDogY2FzdCh0eXBlLCB2YWx1ZSBhcyBFeHByPE51bVR5cGU+KVxuXG5leHBvcnQgZnVuY3Rpb24gaTMyKHZhbHVlOiBudW1iZXIpOiBFeHByPFwiaTMyXCI+XG5leHBvcnQgZnVuY3Rpb24gaTMyPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJpMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBpMzIodmFsdWU6IHVua25vd24pIHsgcmV0dXJuIG51bWJlcihcImkzMlwiLCB2YWx1ZSkgfVxuXG5leHBvcnQgZnVuY3Rpb24gaTY0KHZhbHVlOiBiaWdpbnQpOiBFeHByPFwiaTY0XCI+XG5leHBvcnQgZnVuY3Rpb24gaTY0PFQgZXh0ZW5kcyBJbnRUeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJpNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBpNjQodmFsdWU6IHVua25vd24pIHsgcmV0dXJuIG51bWJlcihcImk2NFwiLCB2YWx1ZSkgfVxuZXhwb3J0IGNvbnN0IGk2NHUgPSAodmFsdWU6IEV4cHI8XCJpMzJcIj4pID0+IGNhc3QoXCJpNjRcIiwgdmFsdWUgYXMgdW5rbm93biBhcyBFeHByPE51bVR5cGU+LCB0cnVlKVxuXG50eXBlIEYzMklucHV0ID0gbnVtYmVyIHwgRXhwcjxcImkzMlwiIHwgXCJpNjRcIiB8IFwiZjMyXCIgfCBcImY2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGYzMih2YWx1ZTogbnVtYmVyKTogRXhwcjxcImYzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGYzMjxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiZjMyXCI+XG5leHBvcnQgZnVuY3Rpb24gZjMyKHZhbHVlOiBGMzJJbnB1dCkgeyByZXR1cm4gbnVtYmVyKFwiZjMyXCIsIHZhbHVlKSB9XG5cbmV4cG9ydCBmdW5jdGlvbiBmNjQodmFsdWU6IG51bWJlcik6IEV4cHI8XCJmNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBmNjQ8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImY2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGY2NCh2YWx1ZTogRjMySW5wdXQpIHsgcmV0dXJuIG51bWJlcihcImY2NFwiLCB2YWx1ZSkgfVxuXG5leHBvcnQgY29uc3QgaWZFbHNlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlXzogRXhwcjxUPik6IEV4cHI8VD4gPT5cbiAgcmVjb3JkRXhwcihleHByPFQ+KHsga2luZDogXCJpZlwiLCB0eXBlOiB0aGVuLnR5cGUsIGNvbmQsIHRoZW4sIGVsc2U6IGVsc2VfIH0gYXMgQ29yZUV4cHI8VD4pKVxuXG5jb25zdCBhcml0aG1ldGljID0gT2JqZWN0LmZyb21FbnRyaWVzKGFyaXRobWV0aWNPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIEFyaXRobWV0aWNPcF06IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbmNvbnN0IGJpdHMgPSBPYmplY3QuZnJvbUVudHJpZXMoYml0T3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaXQob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBCaXRPcF06IDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbmNvbnN0IHJlbWFpbmRlcnMgPSBPYmplY3QuZnJvbUVudHJpZXMocmVtYWluZGVyT3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiByZW1haW5kZXIob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBSZW1haW5kZXJPcF06IDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbmNvbnN0IGNvbXBhcmlzb25zID0gT2JqZWN0LmZyb21FbnRyaWVzKGNtcE9wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gY21wKG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gQ21wT3BdOiA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxcImkzMlwiPiB9XG5cbmZvciAoY29uc3Qgb3Agb2YgYXJpdGhtZXRpY09wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPE51bVR5cGU+KSB7IHJldHVybiBhcml0aG1ldGljW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIGJpdE9wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxJbnRUeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KSB7IHJldHVybiBiaXRzW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIHJlbWFpbmRlck9wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxJbnRUeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KSB7IHJldHVybiByZW1haW5kZXJzW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIGNtcE9wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPE51bVR5cGU+KSB7IHJldHVybiBjb21wYXJpc29uc1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiBbLi4uYXJpdGhtZXRpY09wcywgXCJhbmRcIiwgXCJvclwiLCBcInhvclwiXSBhcyBjb25zdCkgT2JqZWN0LmRlZmluZVByb3BlcnR5KE11dGFibGVNZXRob2RzLnByb3RvdHlwZSwgYGkke29wfWAsIHtcbiAgdmFsdWUodGhpczogTXV0YWJsZVZhbHVlPGFueT4sIHJpZ2h0OiBhbnkpIHsgcmV0dXJuIHRoaXMuc2V0KCh0aGlzIGFzIGFueSlbb3BdKHJpZ2h0KSkgfSxcbn0pXG5cbmV4cG9ydCBjb25zdCB7IGFkZCwgc3ViLCBtdWwsIGRpdiB9ID0gYXJpdGhtZXRpY1xuZXhwb3J0IGNvbnN0IHsgYW5kLCBvciwgeG9yLCBzaGwsIHNociB9ID0gYml0c1xuZXhwb3J0IGNvbnN0IHsgbW9kLCB1bW9kIH0gPSByZW1haW5kZXJzXG5leHBvcnQgY29uc3QgeyBlcSwgbHQsIGd0IH0gPSBjb21wYXJpc29uc1xuXG5leHBvcnQgY29uc3QgZm4gPSA8Y29uc3QgQSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIFJlc3VsdFR5cGU+KFxuICBwYXJhbXM6IEEsXG4gIHJlc3VsdDogUixcbiAgYnVpbGQ6ICguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4gRm5SZXR1cm48Uj4sXG4pID0+IG1rSGFuZGxlKHBhcmFtcywgcmVzdWx0LCAoKC4uLmFyZ3M6IEFyZ3NFeHByPEE+KSA9PiB7XG4gIGxldCByZXR1cm5lZCA9IHVuZGVmaW5lZCBhcyBGblJldHVybjxSPlxuICBjb25zdCBzdGF0ZW1lbnRzID0gY2FwdHVyZSgoKSA9PiB7IHJldHVybmVkID0gYnVpbGQoLi4uYXJncykgfSlcbiAgaWYgKEFycmF5LmlzQXJyYXkocmV0dXJuZWQpKSB0aHJvdyBuZXcgRXJyb3IoXCJXQVNNIGZ1bmN0aW9ucyByZWNvcmQgc3RhdGVtZW50czsgcmV0dXJuaW5nIHN0YXRlbWVudCBhcnJheXMgaXMgbm90IHN1cHBvcnRlZFwiKVxuICBpZiAocmV0dXJuZWQgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IHZhbHVlID0gdHlwZW9mIHJldHVybmVkID09PSBcIm9iamVjdFwiICYmIFwicGFja2VkXCIgaW4gcmV0dXJuZWQgPyByZXR1cm5lZC5wYWNrZWQgOiByZXR1cm5lZFxuICAgIHN0YXRlbWVudHMucHVzaCh7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlOiB2YWx1ZSBhcyBFeHByPE51bVR5cGU+IH0pXG4gIH1cbiAgcmV0dXJuIHN0YXRlbWVudHNcbn0pIGFzICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IFN0bXRbXSlcbmV4cG9ydCBmdW5jdGlvbiBhcnJheTxUIGV4dGVuZHMgRFR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobGVuZ3RoKSB8fCBsZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFycmF5IGxlbmd0aCAke2xlbmd0aH1gKVxuICBjb25zdCBzdHJ1Y3QgPSB0eXBlb2YgdHlwZSA9PT0gXCJvYmplY3RcIiA/IHR5cGUgOiBudWxsXG4gIGNvbnN0IHN0b3JhZ2U6IE1lbW9yeVR5cGUgPSBzdHJ1Y3QgPyBzdHJ1Y3Quc3RvcmFnZSA6IHR5cGUgYXMgTWVtb3J5VHlwZVxuICBjb25zdCBlbGVtZW50U2l6ZSA9IHN0cnVjdCA/IHN0cnVjdC5zaXplIDogc3RvcmFnZVNpemVbc3RvcmFnZV1cbiAgbGV0IGhhbmRsZTogQW55QXJyYXlcbiAgaGFuZGxlID0ge1xuICAgIGtpbmQ6IFwiYXJyYXlcIiwgdHlwZSwgbGVuZ3RoLCBlbGVtZW50U2l6ZSxcbiAgICBhdDogaW5kZXggPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBtZW1vcnlWYWx1ZShoYW5kbGUsIGluZGV4LCBzdG9yYWdlLCBlbGVtZW50U2l6ZSlcbiAgICAgIHJldHVybiBzdHJ1Y3QgPyBzdHJ1Y3RWYWx1ZShzdHJ1Y3QsIHZhbHVlKSA6IHZhbHVlXG4gICAgfSxcbiAgICBtb3ZlOiAodGFyZ2V0LCBzb3VyY2UsIGNvdW50KSA9PiBlbWl0KHsga2luZDogXCJhcnJheS5tb3ZlXCIsIGFycmF5OiBoYW5kbGUsIHRhcmdldDogbGl0KFwiaTMyXCIsIHRhcmdldCksIHNvdXJjZTogbGl0KFwiaTMyXCIsIHNvdXJjZSksIGNvdW50OiBsaXQoXCJpMzJcIiwgY291bnQpIH0pLFxuICB9XG4gIHJldHVybiBoYW5kbGUgYXMgQXJyYXlIYW5kbGU8VD5cbn1cblxuY29uc3QgbWtTdHJ1Y3RMb2NhbCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+KSA9PlxuICBzdHJ1Y3RWYWx1ZSh0eXBlLCBta0xvY2FsKHR5cGUuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiKSlcblxudHlwZSBMb2NhbEZhY3RvcnkgPSB7XG4gIDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCk6IExvY2FsVmFyPFQ+XG4gIDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+KTogTXV0YWJsZVN0cnVjdDxGPlxufVxuXG5jb25zdCBsb2NhbCA9ICg8VCBleHRlbmRzIE51bVR5cGUsIEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFQgfCBTdHJ1Y3RUeXBlPEY+KSA9PlxuICB0eXBlb2YgdHlwZSA9PT0gXCJzdHJpbmdcIiA/IG1rTG9jYWwodHlwZSkgOiBta1N0cnVjdExvY2FsKHR5cGUpKSBhcyBMb2NhbEZhY3RvcnlcblxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKGluaXRpYWw6IG51bWJlcik6IExvY2FsVmFyPFwiaTMyXCI+XG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGUoaW5pdGlhbDogYmlnaW50KTogTG9jYWxWYXI8XCJpNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZTxUIGV4dGVuZHMgTnVtVHlwZT4oaW5pdGlhbDogRXhwcjxUPik6IExvY2FsVmFyPFQ+XG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGU8VCBleHRlbmRzIE51bVR5cGU+KGluaXRpYWw6IEV4cHJMaWtlPFQ+KTogTG9jYWxWYXI8VD5cbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPihpbml0aWFsOiBTdHJ1Y3RWYWx1ZTxGPik6IE11dGFibGVTdHJ1Y3Q8Rj5cbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCBpbml0aWFsPzogTXV0YWJsZVN0cnVjdDxGPiB8IFN0cnVjdEluaXQ8Rj4pOiBNdXRhYmxlU3RydWN0PEY+XG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGUoaW5pdGlhbE9yVHlwZTogYW55LCBpbml0aWFsPzogYW55KTogYW55IHtcbiAgaWYgKHR5cGVvZiBpbml0aWFsT3JUeXBlID09PSBcIm9iamVjdFwiICYmIGluaXRpYWxPclR5cGUua2luZCA9PT0gXCJzdHJ1Y3RcIikge1xuICAgIGNvbnN0IHZhbHVlID0gbG9jYWwoaW5pdGlhbE9yVHlwZSlcbiAgICBpZiAoaW5pdGlhbCAhPT0gdW5kZWZpbmVkKSB2YWx1ZS5zZXQoaW5pdGlhbClcbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuICBpZiAodHlwZW9mIGluaXRpYWxPclR5cGUgPT09IFwib2JqZWN0XCIgJiYgaW5pdGlhbE9yVHlwZSAmJiBcInN0cnVjdFR5cGVcIiBpbiBpbml0aWFsT3JUeXBlKSB7XG4gICAgY29uc3QgdmFsdWUgPSBsb2NhbChpbml0aWFsT3JUeXBlLnN0cnVjdFR5cGUpXG4gICAgdmFsdWUuc2V0KGluaXRpYWxPclR5cGUpXG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cbiAgY29uc3QgdmFsdWUgPSBsb2NhbChpbmZlclR5cGUoaW5pdGlhbE9yVHlwZSkpXG4gIHZhbHVlLnNldChpbml0aWFsT3JUeXBlKVxuICByZXR1cm4gdmFsdWVcbn1cblxuY29uc3QgZXhwSW1wbCA9IGZuKFtcImYzMlwiXSwgXCJmMzJcIiwgeCA9PiB7XG4gIGNvbnN0IHkgPSB2YXJpYWJsZShpZkVsc2UoeC5sdCgtMTYpLCBmMzIoLTE2KSwgaWZFbHNlKHguZ3QoMTYpLCBmMzIoMTYpLCB4KSkuZGl2KDIwNDgpLmFkZCgxKSlcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMTsgaSsrKSB5LmltdWwoeSlcbiAgcmV0dXJuIHlcbn0pXG5leHBvcnQgY29uc3QgZXhwID0gKHZhbHVlOiBFeHByTGlrZTxcImYzMlwiPikgPT4gZXhwSW1wbC5jYWxsKHZhbHVlKVxuXG5leHBvcnQgY29uc3QgZ2xvYmFsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCBpbml0aWFsOiBWYWx1ZTxUPik6IEdsb2JhbFZhbHVlPFQ+ID0+IHtcbiAgbGV0IHZhbHVlITogR2xvYmFsVmFsdWU8VD5cbiAgdmFsdWUgPSBtdXRhYmxlKHsga2luZDogXCJnbG9iYWwuZ2V0XCIsIHR5cGUsIGluaXRpYWwgfSwgaW5wdXQgPT5cbiAgICAoeyBraW5kOiBcImdsb2JhbC5zZXRcIiwgZ2xvYmFsOiB2YWx1ZSBhcyB1bmtub3duIGFzIEFueUdsb2JhbCwgdmFsdWU6IGlucHV0IGFzIEV4cHI8TnVtVHlwZT4gfSkpIGFzIEdsb2JhbFZhbHVlPFQ+XG4gIHJldHVybiB2YWx1ZVxufVxuXG5leHBvcnQgY29uc3QgcmV0dXJuXyA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU/OiBFeHByTGlrZTxUPiB8IHsgcGFja2VkOiBBbnlFeHByIH0pOiB2b2lkID0+IHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIGVtaXQoeyBraW5kOiBcInJldHVyblwiIH0pXG4gIGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiBcInBhY2tlZFwiIGluIHZhbHVlKSBlbWl0KHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU6IHZhbHVlLnBhY2tlZCB9KVxuICBlbHNlIGVtaXQoeyBraW5kOiBcInJldHVyblwiLCB2YWx1ZTogbGl0KGluZmVyVHlwZSh2YWx1ZSksIHZhbHVlKSBhcyBFeHByPE51bVR5cGU+IH0pXG59XG5leHBvcnQgY29uc3QgdHJhcCA9IChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkID0+IHsgZW1pdCh7IGtpbmQ6IFwidHJhcFwiLCBtZXNzYWdlIH0pIH1cbmV4cG9ydCBjb25zdCBib3VuZHNDaGVjayA9IChhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+ID0gMSk6IHZvaWQgPT4ge1xuICBjb25zdCBpID0gbGl0KFwiaTMyXCIsIGluZGV4KSwgbiA9IGxpdChcImkzMlwiLCBjb3VudClcbiAgd2hlbihpLmx0KDApLm9yKG4ubHQoMCkpLm9yKG4uZ3QoYXJyYXkubGVuZ3RoKSkub3IoaS5ndChpMzIoYXJyYXkubGVuZ3RoKS5zdWIobikpKSwgKCkgPT4gdHJhcChcImFycmF5IGJvdW5kcyBleGNlZWRlZFwiKSlcbn1cbmV4cG9ydCBjb25zdCBsb2cgPSAobWVzc2FnZTogc3RyaW5nLCB2YWx1ZTogRXhwckxpa2U8XCJpMzJcIj4pOiB2b2lkID0+IHsgZW1pdCh7IGtpbmQ6IFwibG9nXCIsIG1lc3NhZ2UsIHZhbHVlOiBsaXQoXCJpMzJcIiwgdmFsdWUpIH0pIH1cblxuLyoqIFJlY29yZGVkIGNvbnRyb2wgZmxvdy4gQ2FsbGJhY2tzIGNhcHR1cmUgdGhlaXIgc3RhdGVtZW50cyBpbnRvIG5lc3RlZCBJUi4gKi9cbmV4cG9ydCBjb25zdCB3aGVuID0gKGNvbmRpdGlvbjogRXhwckxpa2U8XCJpMzJcIj4sIHRoZW46ICgpID0+IHZvaWQsIGVsc2VfPzogKCkgPT4gdm9pZCk6IHZvaWQgPT4ge1xuICBlbWl0KHsga2luZDogXCJpZlwiLCBjb25kOiBsaXQoXCJpMzJcIiwgY29uZGl0aW9uKSwgdGhlbjogY2FwdHVyZSh0aGVuKSwgZWxzZTogZWxzZV8gPyBjYXB0dXJlKGVsc2VfKSA6IFtdIH0pXG59XG5cbi8qKiBBIGNhbGxiYWNrIGtlZXBzIHRoZSBjb25kaXRpb24gbGl2ZSBzbyBpdCBpcyBldmFsdWF0ZWQgb24gZXZlcnkgaXRlcmF0aW9uLiAqL1xuZXhwb3J0IGNvbnN0IHdoaWxlXyA9IChjb25kaXRpb246ICgpID0+IEV4cHI8XCJpMzJcIj4sIGJvZHk6ICgpID0+IHZvaWQpOiB2b2lkID0+IHtcbiAgbGV0IGNvbmQhOiBFeHByPFwiaTMyXCI+XG4gIGNvbnN0IGNvbmRpdGlvblN0YXRlbWVudHMgPSBjYXB0dXJlKCgpID0+IHsgY29uZCA9IGNvbmRpdGlvbigpIH0pXG4gIHJlY29yZGluZygpPy5wdXNoKC4uLmNvbmRpdGlvblN0YXRlbWVudHMpXG4gIGVtaXQoeyBraW5kOiBcImxvb3BcIiwgY29uZCwgYm9keTogWy4uLmNhcHR1cmUoYm9keSksIC4uLmNvbmRpdGlvblN0YXRlbWVudHNdIH0pXG59XG5cbmV4cG9ydCBjb25zdCBmb3JfID0gKHN0YXJ0OiBFeHByTGlrZTxcImkzMlwiPiwgZW5kOiBFeHByTGlrZTxcImkzMlwiPiwgYm9keTogKGluZGV4OiBMb2NhbFZhcjxcImkzMlwiPikgPT4gdm9pZCk6IHZvaWQgPT4ge1xuICBjb25zdCBpbmRleCA9IG1rTG9jYWwoXCJpMzJcIilcbiAgZW1pdCh7IGtpbmQ6IFwiZm9yXCIsIGxvY2FsOiBpbmRleC5sb2NhbCwgc3RhcnQ6IGxpdChcImkzMlwiLCBzdGFydCksIGVuZDogbGl0KFwiaTMyXCIsIGVuZCksIGJvZHk6IGNhcHR1cmUoKCkgPT4gYm9keShpbmRleCkpIH0pXG59XG4iLAogICAgImltcG9ydCB7XG4gIGFsbG9jYXRlTG9jYWwsXG4gIHR5cGUgQW55QXJyYXksIHR5cGUgQW55RnVuYywgdHlwZSBBbnlHbG9iYWwsIHR5cGUgQXJyYXlEZWZzLCB0eXBlIEV4cHIsXG4gIHR5cGUgRnVuY0RlZnMsIHR5cGUgTW9kdWxlRGVmLCB0eXBlIE51bVR5cGUsXG59IGZyb20gXCIuL2FzdFwiXG5cbmNvbnN0IGRpZSA9ICh4OiB1bmtub3duKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgdmFsdWU6ICR7U3RyaW5nKHgpfWApIH1cbmV4cG9ydCB0eXBlIEFycmF5TGF5b3V0ID0geyBsZW5ndGg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIsIGVsZW1lbnRTaXplOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgTW9kdWxlQW5hbHlzaXM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7XG4gIGZ1bmNzOiBGdW5jRGVmczxUPlxuICBhcnJheXM6IEFycmF5RGVmczxUPlxuICBmRW50cmllczogW2tleW9mIEZ1bmNEZWZzPFQ+ICYgc3RyaW5nLCBGdW5jRGVmczxUPltrZXlvZiBGdW5jRGVmczxUPl1dW11cbiAgYnVpbHRGdW5jczogQnVpbHRGdW5jW11cbiAgZml4OiBNYXA8QW55RnVuYywgbnVtYmVyPlxuICBsYXlvdXRzOiBNYXA8QW55QXJyYXksIEFycmF5TGF5b3V0PlxuICBnbG9iYWxzOiBNYXA8QW55R2xvYmFsLCBudW1iZXI+XG4gIHRyYXBNZXNzYWdlczogc3RyaW5nW11cbiAgbG9nTWVzc2FnZXM6IHN0cmluZ1tdXG4gIHBhZ2VzOiBudW1iZXJcbn1cblxudHlwZSBWaXNpdG9ycyA9IHtcbiAgbG9jYWw/OiAoaWQ6IG51bWJlciwgdHlwZTogTnVtVHlwZSkgPT4gdm9pZFxuICBhcnJheT86IChhcnJheTogQW55QXJyYXkpID0+IHZvaWRcbiAgZnVuYz86IChmdW5jOiBBbnlGdW5jKSA9PiB2b2lkXG4gIGdsb2JhbD86IChnbG9iYWw6IEFueUdsb2JhbCkgPT4gdm9pZFxuICB0cmFwPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxuICBsb2c/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG59XG5jb25zdCB3YWxrID0gKG5vZGU6IGFueSwgZm5zOiBWaXNpdG9ycyk6IHZvaWQgPT4ge1xuICBpZiAobm9kZSA9PSBudWxsKSByZXR1cm5cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHJldHVybiBub2RlLmZvckVhY2goeCA9PiB3YWxrKHgsIGZucykpXG4gIGNvbnN0IGNoaWxkcmVuID0gKC4uLnZhbHVlczogYW55W10pID0+IHZhbHVlcy5mb3JFYWNoKHggPT4gd2Fsayh4LCBmbnMpKVxuICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgIGNhc2UgXCJjb25zdFwiOiByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6IGZucy5sb2NhbD8uKG5vZGUubG9jYWwsIG5vZGUudHlwZSk7IHJldHVyblxuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjogZm5zLmxvY2FsPy4obm9kZS5sb2NhbCwgbm9kZS50eXBlKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJnbG9iYWwuZ2V0XCI6IGZucy5nbG9iYWw/Lihub2RlKTsgcmV0dXJuXG4gICAgY2FzZSBcImdsb2JhbC5zZXRcIjogZm5zLmdsb2JhbD8uKG5vZGUuZ2xvYmFsKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJiaW5cIjogY2FzZSBcImNtcFwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5sZWZ0LCBub2RlLnJpZ2h0KVxuICAgIGNhc2UgXCJjYWxsXCI6IGNhc2UgXCJjYWxsLnZvaWRcIjogZm5zLmZ1bmM/Lihub2RlLnRhcmdldCk7IHJldHVybiB3YWxrKG5vZGUuYXJncywgZm5zKVxuICAgIGNhc2UgXCJjYXN0XCI6IGNhc2UgXCJyZXR1cm5cIjogcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJpZlwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5jb25kLCBub2RlLnRoZW4sIG5vZGUuZWxzZSlcbiAgICBjYXNlIFwibG9hZFwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIHdhbGsobm9kZS5pbmRleCwgZm5zKVxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIGNoaWxkcmVuKG5vZGUuaW5kZXgsIG5vZGUudmFsdWUpXG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiBjaGlsZHJlbihub2RlLnRhcmdldCwgbm9kZS5zb3VyY2UsIG5vZGUuY291bnQpXG4gICAgY2FzZSBcImxvb3BcIjogcmV0dXJuIGNoaWxkcmVuKG5vZGUuY29uZCwgbm9kZS5ib2R5KVxuICAgIGNhc2UgXCJmb3JcIjogZm5zLmxvY2FsPy4obm9kZS5sb2NhbCwgXCJpMzJcIik7IHJldHVybiBjaGlsZHJlbihub2RlLnN0YXJ0LCBub2RlLmVuZCwgbm9kZS5ib2R5KVxuICAgIGNhc2UgXCJ0cmFwXCI6IGZucy50cmFwPy4obm9kZS5tZXNzYWdlKTsgcmV0dXJuXG4gICAgY2FzZSBcImxvZ1wiOiBmbnMubG9nPy4obm9kZS5tZXNzYWdlKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGRlZmF1bHQ6IGRpZShub2RlKVxuICB9XG59XG5cblxuY29uc3QgYXJyYXlMYXlvdXRzID0gKGFycmF5czogQW55QXJyYXlbXSkgPT4ge1xuICBsZXQgb2Zmc2V0ID0gMFxuICBjb25zdCBsYXlvdXRzID0gbmV3IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+KClcbiAgZm9yIChjb25zdCBhcnIgb2YgYXJyYXlzKSB7XG4gICAgY29uc3QgYWxpZ24gPSBNYXRoLm1pbihhcnIuZWxlbWVudFNpemUsIDgpXG4gICAgb2Zmc2V0ID0gTWF0aC5jZWlsKG9mZnNldCAvIGFsaWduKSAqIGFsaWduXG4gICAgbGF5b3V0cy5zZXQoYXJyLCB7IGxlbmd0aDogYXJyLmxlbmd0aCwgb2Zmc2V0LCBlbGVtZW50U2l6ZTogYXJyLmVsZW1lbnRTaXplIH0pXG4gICAgb2Zmc2V0ICs9IGFyci5sZW5ndGggKiBhcnIuZWxlbWVudFNpemVcbiAgfVxuICByZXR1cm4geyBsYXlvdXRzLCBieXRlczogb2Zmc2V0IH1cbn1cblxuZXhwb3J0IHR5cGUgQnVpbHRGdW5jID0ge1xuICBmdW5jOiBBbnlGdW5jXG4gIGJ1aWx0OiBpbXBvcnQoXCIuL2FzdFwiKS5TdG10W11cbiAgbG9jYWxzOiBbbnVtYmVyLCBOdW1UeXBlXVtdXG4gIGxvY2FsSW5kZXhlczogUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICBmdW5jdGlvbnM6IEFueUZ1bmNbXVxuICBhcnJheXM6IEFueUFycmF5W11cbiAgdHJhcHM6IHN0cmluZ1tdXG4gIGxvZ3M6IHN0cmluZ1tdXG4gIGdsb2JhbHM6IEFueUdsb2JhbFtdXG59XG5cbmNvbnN0IGJ1aWxkRnVuYyA9IChmdW5jOiBBbnlGdW5jKTogQnVpbHRGdW5jID0+IHtcbiAgY29uc3QgcGFyYW1zID0gZnVuYy5wYXJhbXMubWFwKHR5cGUgPT4gYWxsb2NhdGVMb2NhbCh0eXBlKSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gIGNvbnN0IHBhcmFtSWRzID0gcGFyYW1zLm1hcChwID0+IHAua2luZCA9PT0gXCJsb2NhbC5nZXRcIiA/IHAubG9jYWwgOiAtMSlcbiAgY29uc3QgcmVzdWx0ID0gZnVuYy5idWlsZCguLi5wYXJhbXMpXG4gIGNvbnN0IGJ1aWx0ID0gcmVzdWx0XG4gIGNvbnN0IGZvdW5kID0gbmV3IE1hcDxudW1iZXIsIE51bVR5cGU+KClcbiAgY29uc3QgZnVuY3Rpb25zID0gbmV3IFNldDxBbnlGdW5jPigpLCBhcnJheXMgPSBuZXcgU2V0PEFueUFycmF5PigpLCBnbG9iYWxzID0gbmV3IFNldDxBbnlHbG9iYWw+KCksIHRyYXBzID0gbmV3IFNldDxzdHJpbmc+KCksIGxvZ3MgPSBuZXcgU2V0PHN0cmluZz4oKVxuICB3YWxrKGJ1aWx0LCB7XG4gICAgbG9jYWw6IChpZCwgdHlwZSkgPT4gZm91bmQuc2V0KGlkLCB0eXBlKSwgZnVuYzogZiA9PiBmdW5jdGlvbnMuYWRkKGYpLCBhcnJheTogYSA9PiBhcnJheXMuYWRkKGEpLFxuICAgIGdsb2JhbDogdmFsdWUgPT4gZ2xvYmFscy5hZGQodmFsdWUpLCB0cmFwOiBtZXNzYWdlID0+IHRyYXBzLmFkZChtZXNzYWdlKSwgbG9nOiBtZXNzYWdlID0+IGxvZ3MuYWRkKG1lc3NhZ2UpLFxuICB9KVxuICBwYXJhbUlkcy5mb3JFYWNoKGlkID0+IGZvdW5kLmRlbGV0ZShpZCkpXG4gIGNvbnN0IGxvY2FscyA9IFsuLi5mb3VuZC5lbnRyaWVzKCldXG4gIGNvbnN0IGxvY2FsSW5kZXhlcyA9IE9iamVjdC5mcm9tRW50cmllcyhbXG4gICAgLi4ucGFyYW1JZHMubWFwKChpZCwgaSkgPT4gW2lkLCBpXSksXG4gICAgLi4ubG9jYWxzLm1hcCgoW2lkXSwgaSkgPT4gW2lkLCBmdW5jLnBhcmFtcy5sZW5ndGggKyBpXSksXG4gIF0pXG4gIHJldHVybiB7IGZ1bmMsIGJ1aWx0LCBsb2NhbHMsIGxvY2FsSW5kZXhlcywgZnVuY3Rpb25zOiBbLi4uZnVuY3Rpb25zXSwgYXJyYXlzOiBbLi4uYXJyYXlzXSwgZ2xvYmFsczogWy4uLmdsb2JhbHNdLCB0cmFwczogWy4uLnRyYXBzXSwgbG9nczogWy4uLmxvZ3NdIH1cbn1cblxuY29uc3QgYnVpbGRSZWZlcmVuY2VkRnVuY3Rpb25zID0gKHJvb3RzOiBBbnlGdW5jW10pID0+IHtcbiAgY29uc3QgYnVpbHQgPSBuZXcgTWFwPEFueUZ1bmMsIEJ1aWx0RnVuYz4oKVxuICBjb25zdCB2aXNpdCA9IChmdW5jOiBBbnlGdW5jKSA9PiB7XG4gICAgaWYgKGJ1aWx0LmhhcyhmdW5jKSkgcmV0dXJuXG4gICAgY29uc3QgZW50cnkgPSBidWlsZEZ1bmMoZnVuYylcbiAgICBidWlsdC5zZXQoZnVuYywgZW50cnkpXG4gICAgZW50cnkuZnVuY3Rpb25zLmZvckVhY2godmlzaXQpXG4gIH1cbiAgcm9vdHMuZm9yRWFjaCh2aXNpdClcbiAgcmV0dXJuIFsuLi5idWlsdC52YWx1ZXMoKV1cbn1cblxuZXhwb3J0IGNvbnN0IGFuYWx5emVNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PiB7XG4gIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhtb2QpXG4gIGNvbnN0IGZ1bmNzID0gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImZ1bmNcIikpIGFzIEZ1bmNEZWZzPFQ+XG4gIGNvbnN0IGFycmF5cyA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzLmZpbHRlcigoWywgdl0pID0+IHYua2luZCA9PT0gXCJhcnJheVwiKSkgYXMgQXJyYXlEZWZzPFQ+XG4gIGNvbnN0IGZFbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZnVuY3MpIGFzIFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGNvbnN0IGJ1aWx0RnVuY3MgPSBidWlsZFJlZmVyZW5jZWRGdW5jdGlvbnMoZkVudHJpZXMubWFwKChbLCBmdW5jXSkgPT4gZnVuYykpXG4gIGNvbnN0IGZpeCA9IG5ldyBNYXAoYnVpbHRGdW5jcy5tYXAoKHsgZnVuYyB9LCBpKSA9PiBbZnVuYywgaV0pKVxuICBjb25zdCBhbGxBcnJheXMgPSBbLi4ubmV3IFNldChbLi4uYnVpbHRGdW5jcy5mbGF0TWFwKGZ1bmMgPT4gZnVuYy5hcnJheXMpLCAuLi5PYmplY3QudmFsdWVzKGFycmF5cykgYXMgQW55QXJyYXlbXV0pXVxuICBjb25zdCBhbGxHbG9iYWxzID0gWy4uLm5ldyBTZXQoWy4uLmJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMuZ2xvYmFscyksIC4uLmVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImdsb2JhbC5nZXRcIikubWFwKChbLCB2XSkgPT4gdiBhcyBBbnlHbG9iYWwpXSldXG4gIGNvbnN0IGdsb2JhbHMgPSBuZXcgTWFwKGFsbEdsb2JhbHMubWFwKCh2YWx1ZSwgaSkgPT4gW3ZhbHVlLCBpXSkpXG4gIGNvbnN0IHsgbGF5b3V0cywgYnl0ZXMgfSA9IGFycmF5TGF5b3V0cyhhbGxBcnJheXMpXG4gIGNvbnN0IHRyYXBNZXNzYWdlcyA9IFsuLi5uZXcgU2V0KGJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMudHJhcHMpKV1cbiAgY29uc3QgbG9nTWVzc2FnZXMgPSBbLi4ubmV3IFNldChidWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmxvZ3MpKV1cbiAgcmV0dXJuIHsgZnVuY3MsIGFycmF5cywgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgZ2xvYmFscywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXM6IE1hdGgubWF4KDEsIE1hdGguY2VpbChieXRlcyAvIDY1NTM2KSkgfSBhcyBNb2R1bGVBbmFseXNpczxUPlxufVxuIiwKICAgICJpbXBvcnQge1xuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUV4cHIsIHR5cGUgQW55RnVuYywgdHlwZSBBbnlHbG9iYWwsIHR5cGUgQXJpdGhtZXRpY09wLCB0eXBlIEJpdE9wLCB0eXBlIENtcE9wLCB0eXBlIEV4cHIsXG4gIHR5cGUgTWVtb3J5VHlwZSwgdHlwZSBNb2R1bGVEZWYsIHR5cGUgTnVtVHlwZSwgdHlwZSBSZW1haW5kZXJPcCwgdHlwZSBTdG10LFxufSBmcm9tIFwiLi9hc3RcIlxuaW1wb3J0IHsgdHlwZSBBcnJheUxheW91dCwgdHlwZSBNb2R1bGVBbmFseXNpcyB9IGZyb20gXCIuL2FuYWx5emVcIlxuXG5jb25zdCBtYWdpYyA9IFsweDAwLCAweDYxLCAweDczLCAweDZkLCAweDAxLCAweDAwLCAweDAwLCAweDAwXVxuY29uc3QgcmVzdWx0VHlwZSA9IChyZXN1bHQ6IEFueUZ1bmNbXCJyZXN1bHRcIl0pID0+XG4gIHR5cGVvZiByZXN1bHQgPT09IFwib2JqZWN0XCIgPyByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiIDogcmVzdWx0XG5cbmNvbnN0IG51bWJlckJhc2UgPSB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+XG5jb25zdCBvcGNvZGUgPSAob3A6IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3AgfCBDbXBPcCwgdHlwZTogTnVtVHlwZSkgPT4ge1xuICBjb25zdCBhcml0aG1ldGljID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdLmluZGV4T2Yob3ApXG4gIGlmIChhcml0aG1ldGljID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgYXJpdGhtZXRpY1xuICBjb25zdCBpbnRlZ2VyID0gW1wibW9kXCIsIFwidW1vZFwiLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwiXCIsIFwic2hyXCJdLmluZGV4T2Yob3ApXG4gIGlmIChpbnRlZ2VyID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgNSArIGludGVnZXJcbiAgcmV0dXJuICh7IGkzMjogMHg0NiwgaTY0OiAweDUxLCBmMzI6IDB4NWIsIGY2NDogMHg2MSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+KVt0eXBlXVxuICAgICsgKG9wID09PSBcImVxXCIgPyAwIDogb3AgPT09IFwibHRcIiA/IDIgOiB0eXBlWzBdID09PSBcImlcIiA/IDQgOiAzKVxufVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgbG9hZDogeyBpMzI6IDB4MjgsIGk2NDogMHgyOSwgZjMyOiAweDJhLCBmNjQ6IDB4MmIsIGk4OiAweDJjLCB1ODogMHgyZCwgaTE2OiAweDJlLCB1MTY6IDB4MmYgfSBhcyBSZWNvcmQ8TWVtb3J5VHlwZSwgbnVtYmVyPixcbiAgc3RvcmU6IHsgaTMyOiAweDM2LCBpNjQ6IDB4MzcsIGYzMjogMHgzOCwgZjY0OiAweDM5LCBpODogMHgzYSwgdTg6IDB4M2EsIGkxNjogMHgzYiwgdTE2OiAweDNiIH0gYXMgUmVjb3JkPE1lbW9yeVR5cGUsIG51bWJlcj4sXG4gIGFsaWduOiB7IGk4OiAwLCB1ODogMCwgaTE2OiAxLCB1MTY6IDEsIGkzMjogMiwgZjMyOiAyLCBpNjQ6IDMsIGY2NDogMyB9IGFzIFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+LFxuICB6ZXJvOiB7IGkzMjogWzB4NDEsIDBdLCBpNjQ6IFsweDQyLCAwXSwgZjMyOiBbMHg0MywgMCwgMCwgMCwgMF0sIGY2NDogWzB4NDQsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcltdPixcbn1cblxuY29uc3QgdTMyID0gKG46IG51bWJlcikgPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdW5zaWduZWQgaW50ZWdlciwgZ290ICR7bn1gKVxuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgZG8ge1xuICAgIGxldCBieXRlID0gbiAmIDB4N2ZcbiAgICBuID4+Pj0gN1xuICAgIGlmIChuKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICB9IHdoaWxlIChuKVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IHNOID0gKHZhbHVlOiBudW1iZXIgfCBiaWdpbnQsIGJpdHM6IDMyIHwgNjQpID0+IHtcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGxldCBuID0gYml0cyA9PT0gMzIgPyBCaWdJbnQoKHZhbHVlIGFzIG51bWJlcikgfCAwKSA6IEJpZ0ludC5hc0ludE4oNjQsIHZhbHVlIGFzIGJpZ2ludClcbiAgZm9yICg7Oykge1xuICAgIGxldCBieXRlID0gTnVtYmVyKG4gJiAweDdmbilcbiAgICBuID4+PSA3blxuICAgIGNvbnN0IGRvbmUgPSAobiA9PT0gMG4gJiYgKGJ5dGUgJiAweDQwKSA9PT0gMCkgfHwgKG4gPT09IC0xbiAmJiAoYnl0ZSAmIDB4NDApICE9PSAwKVxuICAgIGlmICghZG9uZSkgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgICBpZiAoZG9uZSkgcmV0dXJuIG91dFxuICB9XG59XG5cbmNvbnN0IGZOID0gKHZhbHVlOiBudW1iZXIsIGJ5dGVzOiA0IHwgOCkgPT4ge1xuICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShieXRlcylcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhvdXQuYnVmZmVyKVxuICBieXRlcyA9PT0gNCA/IHZpZXcuc2V0RmxvYXQzMigwLCB2YWx1ZSwgdHJ1ZSkgOiB2aWV3LnNldEZsb2F0NjQoMCwgdmFsdWUsIHRydWUpXG4gIHJldHVybiBbLi4ub3V0XVxufVxuXG5jb25zdCBnbG9iYWxJbml0ID0gKHZhbHVlOiBBbnlHbG9iYWwpID0+XG4gIHZhbHVlLnR5cGUgPT09IFwiaTMyXCIgPyBbMHg0MSwgLi4uc04odmFsdWUuaW5pdGlhbCBhcyBudW1iZXIsIDMyKV0gOlxuICB2YWx1ZS50eXBlID09PSBcImk2NFwiID8gWzB4NDIsIC4uLnNOKHZhbHVlLmluaXRpYWwsIDY0KV0gOlxuICB2YWx1ZS50eXBlID09PSBcImYzMlwiID8gWzB4NDMsIC4uLmZOKHZhbHVlLmluaXRpYWwgYXMgbnVtYmVyLCA0KV0gOlxuICBbMHg0NCwgLi4uZk4odmFsdWUuaW5pdGlhbCBhcyBudW1iZXIsIDgpXVxuXG5jb25zdCBzdHIgPSAoczogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpXG4gIHJldHVybiBbLi4udTMyKGJ5dGVzLmxlbmd0aCksIC4uLmJ5dGVzXVxufVxuXG5jb25zdCBzZWN0aW9uID0gKGlkOiBudW1iZXIsIHBheWxvYWQ6IG51bWJlcltdKSA9PiBbaWQsIC4uLnUzMihwYXlsb2FkLmxlbmd0aCksIC4uLnBheWxvYWRdXG5jb25zdCBmbGF0TWFwID0gPFQsIFI+KHhzOiBUW10sIGZuOiAoeDogVCkgPT4gUltdKSA9PiB4cy5mbGF0TWFwKGZuKVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5cbmNvbnN0IGFkZHIgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZSA9IGxheW91dC5lbGVtZW50U2l6ZSwgZmllbGRPZmZzZXQgPSAwKSA9PlxuICBpbmRleC5tdWwoc3RyaWRlKS5hZGQobGF5b3V0Lm9mZnNldCArIGZpZWxkT2Zmc2V0KVxuY29uc3QgbWVtYXJnID0gKHR5cGU6IE1lbW9yeVR5cGUsIG9mZnNldCA9IDApID0+IFsuLi51MzIoY29kZXMuYWxpZ25bdHlwZV0pLCAuLi51MzIob2Zmc2V0KV1cbmNvbnN0IGNvbnN0STMyID0gKGU6IEV4cHI8XCJpMzJcIj4pID0+IGUua2luZCA9PT0gXCJjb25zdFwiID8gZS52YWx1ZSA6IG51bGxcbmNvbnN0IGNoZWNrQXJyYXlCb3VuZHMgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgbiA9IGNvbnN0STMyKGluZGV4KVxuICBpZiAobiA9PSBudWxsKSByZXR1cm5cbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pIHx8IG4gPCAwIHx8IG4gPj0gbGF5b3V0Lmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGBBcnJheSBpbmRleCAke259IG91dCBvZiBib3VuZHMgZm9yIGxlbmd0aCAke2xheW91dC5sZW5ndGh9YClcbn1cbmNvbnN0IGNoZWNrTW92ZUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCB0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgdmFsdWVzID0gW2NvbnN0STMyKHRhcmdldCksIGNvbnN0STMyKHNvdXJjZSksIGNvbnN0STMyKGNvdW50KV1cbiAgaWYgKHZhbHVlcy5zb21lKHZhbHVlID0+IHZhbHVlID09IG51bGwpKSByZXR1cm5cbiAgY29uc3QgW3RvLCBmcm9tLCBzaXplXSA9IHZhbHVlcyBhcyBudW1iZXJbXVxuICBpZiAodG8hIDwgMCB8fCBmcm9tISA8IDAgfHwgc2l6ZSEgPCAwIHx8IHRvISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aCB8fCBmcm9tISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IG1vdmUgKCR7dG99LCAke2Zyb219LCAke3NpemV9KSBvdXQgb2YgYm91bmRzIGZvciBsZW5ndGggJHtsYXlvdXQubGVuZ3RofWApXG59XG5cbmNvbnN0IG1ha2VDb21waWxlciA9IChcbiAgZml4OiBNYXA8QW55RnVuYywgbnVtYmVyPiwgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LCBhcnJheXM6IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+LFxuICB0cmFwczogTWFwPHN0cmluZywgbnVtYmVyPiwgbG9nczogTWFwPHN0cmluZywgbnVtYmVyPiwgZ2xvYmFsczogTWFwPEFueUdsb2JhbCwgbnVtYmVyPixcbikgPT4ge1xuY29uc3QgY29tcGlsZUV4cHIgPSAoZTogQW55RXhwcik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjpcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTMyXCIpIHJldHVybiBbMHg0MSwgLi4uc04oZS52YWx1ZSBhcyBudW1iZXIsIDMyKV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTY0XCIpIHJldHVybiBbMHg0MiwgLi4uc04oZS52YWx1ZSwgNjQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmMzJcIikgcmV0dXJuIFsweDQzLCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgNCldXG4gICAgICBpZiAoZS50eXBlID09PSBcImY2NFwiKSByZXR1cm4gWzB4NDQsIC4uLmZOKGUudmFsdWUgYXMgbnVtYmVyLCA4KV1cbiAgICAgIHJldHVybiBkaWUoZSlcbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6XG4gICAgICByZXR1cm4gWzB4MjAsIC4uLnUzMihsaXhbZS5sb2NhbF0hKV1cbiAgICBjYXNlIFwiZ2xvYmFsLmdldFwiOlxuICAgICAgcmV0dXJuIFsweDIzLCAuLi51MzIoZ2xvYmFscy5nZXQoZSkhKV1cbiAgICBjYXNlIFwiYmluXCI6IHtcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5sZWZ0KSwgLi4uY29tcGlsZUV4cHIoZS5yaWdodCksIG9wY29kZShlLm9wLCBlLnR5cGUpXVxuICAgIH1cbiAgICBjYXNlIFwiY21wXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQpLCBvcGNvZGUoZS5vcCwgZS5pbnB1dFR5cGUpXVxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICByZXR1cm4gWy4uLmZsYXRNYXAoZS5hcmdzLCBjb21waWxlRXhwciksIDB4MTAsIC4uLnUzMihmaXguZ2V0KGUudGFyZ2V0KSEgKyAyKV1cbiAgICBjYXNlIFwiY2FzdFwiOiB7XG4gICAgICBjb25zdCBmcm9tID0gZS5pbnB1dFR5cGUgYXMgTnVtVHlwZVxuICAgICAgY29uc3QgdG8gPSBlLnR5cGUgYXMgTnVtVHlwZVxuICAgICAgbGV0IG9wY29kZTogbnVtYmVyIHwgdW5kZWZpbmVkXG4gICAgICBpZiAodG8gPT09IFwiaTMyXCIgJiYgZnJvbSA9PT0gXCJpNjRcIikgb3Bjb2RlID0gMHhhN1xuICAgICAgaWYgKHRvID09PSBcImkzMlwiICYmIGZyb20gPT09IFwiZjMyXCIpIG9wY29kZSA9IDB4YThcbiAgICAgIGlmICh0byA9PT0gXCJpMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGFhXG4gICAgICBpZiAodG8gPT09IFwiaTY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gZS51bnNpZ25lZCA/IDB4YWQgOiAweGFjXG4gICAgICBpZiAodG8gPT09IFwiZjMyXCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiMlxuICAgICAgaWYgKHRvID09PSBcImYzMlwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjRcbiAgICAgIGlmICh0byA9PT0gXCJmMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGI2XG4gICAgICBpZiAodG8gPT09IFwiZjY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiN1xuICAgICAgaWYgKHRvID09PSBcImY2NFwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjlcbiAgICAgIGlmICh0byA9PT0gXCJmNjRcIiAmJiBmcm9tID09PSBcImYzMlwiKSBvcGNvZGUgPSAweGJiXG4gICAgICBpZiAob3Bjb2RlID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY2FzdCAke2Zyb219IC0+ICR7dG99YClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS52YWx1ZSksIG9wY29kZV1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUuY29uZCksIDB4MDQsIGNvZGVzLnR5cGVbZS50eXBlIGFzIE51bVR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4pLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UpLCAweDBiXVxuICAgIGNhc2UgXCJsb2FkXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQoZS5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtlLmFycmF5fWApXG4gICAgICBjaGVja0FycmF5Qm91bmRzKGxheW91dCwgZS5pbmRleClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIGUuaW5kZXgsIGUuc3RyaWRlLCBlLm9mZnNldCkpLCBjb2Rlcy5sb2FkW2Uuc3RvcmFnZSBhcyBNZW1vcnlUeXBlXSwgLi4ubWVtYXJnKGUuc3RvcmFnZSBhcyBNZW1vcnlUeXBlKV1cbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUoZSlcbiAgfVxufVxuXG5jb25zdCBjb21waWxlU3RtdCA9IChzOiBTdG10KTogbnVtYmVyW10gPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MjEsIC4uLnUzMihsaXhbcy5sb2NhbF0hKV1cbiAgICBjYXNlIFwiZ2xvYmFsLnNldFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgMHgyNCwgLi4udTMyKGdsb2JhbHMuZ2V0KHMuZ2xvYmFsKSEpXVxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBhcnJheXMuZ2V0KHMuYXJyYXkpXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tBcnJheUJvdW5kcyhsYXlvdXQsIHMuaW5kZXgpXG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLmluZGV4LCBzLnN0cmlkZSwgcy5vZmZzZXQpKSwgLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIGNvZGVzLnN0b3JlW3MudHlwZV0sIC4uLm1lbWFyZyhzLnR5cGUpXVxuICAgIH1cbiAgICBjYXNlIFwiYXJyYXkubW92ZVwiOiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBhcnJheXMuZ2V0KHMuYXJyYXkpXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tNb3ZlQm91bmRzKGxheW91dCwgcy50YXJnZXQsIHMuc291cmNlLCBzLmNvdW50KVxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIHMudGFyZ2V0KSksXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLnNvdXJjZSkpLFxuICAgICAgICAuLi5jb21waWxlRXhwcihzLmNvdW50Lm11bChsYXlvdXQuZWxlbWVudFNpemUpKSxcbiAgICAgICAgMHhmYywgMHgwYSwgMHgwMCwgMHgwMCxcbiAgICAgIF1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMuY29uZCksIDB4MDQsIDB4NDAsIC4uLmZsYXRNYXAocy50aGVuLCBjb21waWxlU3RtdCksIC4uLihzLmVsc2UubGVuZ3RoID8gWzB4MDUsIC4uLmZsYXRNYXAocy5lbHNlLCBjb21waWxlU3RtdCldIDogW10pLCAweDBiXVxuICAgIGNhc2UgXCJsb29wXCI6XG4gICAgICByZXR1cm4gWzB4MDIsIDB4NDAsIDB4MDMsIDB4NDAsIC4uLmNvbXBpbGVFeHByKHMuY29uZCksIDB4NDUsIDB4MGQsIC4uLnUzMigxKSwgLi4uZmxhdE1hcChzLmJvZHksIGNvbXBpbGVTdG10KSwgMHgwYywgLi4udTMyKDApLCAweDBiLCAweDBiXVxuICAgIGNhc2UgXCJmb3JcIjoge1xuICAgICAgY29uc3QgaW5kZXggPSBsaXhbcy5sb2NhbF0hXG4gICAgICByZXR1cm4gW1xuICAgICAgICAuLi5jb21waWxlRXhwcihzLnN0YXJ0KSwgMHgyMSwgLi4udTMyKGluZGV4KSxcbiAgICAgICAgMHgwMiwgMHg0MCxcbiAgICAgICAgMHgwMywgMHg0MCxcbiAgICAgICAgMHgyMCwgLi4udTMyKGluZGV4KSwgLi4uY29tcGlsZUV4cHIocy5lbmQpLCAweDQ4LCAweDQ1LCAweDBkLCAuLi51MzIoMSksXG4gICAgICAgIC4uLmZsYXRNYXAocy5ib2R5LCBjb21waWxlU3RtdCksXG4gICAgICAgIDB4MjAsIC4uLnUzMihpbmRleCksIDB4NDEsIDB4MDEsIDB4NmEsIDB4MjEsIC4uLnUzMihpbmRleCksXG4gICAgICAgIDB4MGMsIC4uLnUzMigwKSxcbiAgICAgICAgMHgwYiwgMHgwYixcbiAgICAgIF1cbiAgICB9XG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgcmV0dXJuIFsuLi4ocy52YWx1ZSA/IGNvbXBpbGVFeHByKHMudmFsdWUpIDogW10pLCAweDBmXVxuICAgIGNhc2UgXCJ0cmFwXCI6XG4gICAgICByZXR1cm4gWzB4NDEsIC4uLnNOKHRyYXBzLmdldChzLm1lc3NhZ2UpISwgMzIpLCAweDEwLCAweDAwXVxuICAgIGNhc2UgXCJsb2dcIjpcbiAgICAgIHJldHVybiBbMHg0MSwgLi4uc04obG9ncy5nZXQocy5tZXNzYWdlKSEsIDMyKSwgLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MTAsIDB4MDFdXG4gICAgY2FzZSBcImNhbGwudm9pZFwiOlxuICAgICAgcmV0dXJuIFsuLi5mbGF0TWFwKHMuYXJncywgY29tcGlsZUV4cHIpLCAweDEwLCAuLi51MzIoZml4LmdldChzLnRhcmdldCkhICsgMildXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUocylcbiAgfVxufVxucmV0dXJuIHsgZXhwcjogY29tcGlsZUV4cHIsIHN0bXQ6IGNvbXBpbGVTdG10IH1cbn1cblxuXG5leHBvcnQgY29uc3QgZW1pdE1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPih7IGZFbnRyaWVzLCBidWlsdEZ1bmNzLCBmaXgsIGxheW91dHMsIGdsb2JhbHMsIHRyYXBNZXNzYWdlcywgbG9nTWVzc2FnZXMsIHBhZ2VzIH06IE1vZHVsZUFuYWx5c2lzPFQ+KSA9PiB7XG4gIGNvbnN0IHRyYXBzID0gbmV3IE1hcCh0cmFwTWVzc2FnZXMubWFwKChtZXNzYWdlLCBpZCkgPT4gW21lc3NhZ2UsIGlkXSkpXG4gIGNvbnN0IGxvZ3MgPSBuZXcgTWFwKGxvZ01lc3NhZ2VzLm1hcCgobWVzc2FnZSwgaWQpID0+IFttZXNzYWdlLCBpZF0pKVxuICBjb25zdCBmdW5jdGlvblNlY3Rpb24gPSBidWlsdEZ1bmNzLmZsYXRNYXAoKF8sIGkpID0+IHUzMihpICsgMikpXG4gIGNvbnN0IGV4cG9ydFNlY3Rpb24gPSBmRW50cmllcy5mbGF0TWFwKChbbmFtZSwgZnVuY10pID0+IFsuLi5zdHIobmFtZSksIDB4MDAsIC4uLnUzMihmaXguZ2V0KGZ1bmMpISArIDIpXSlcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFtcbiAgICAuLi5tYWdpYyxcbiAgICAuLi5zZWN0aW9uKDB4MDEsIFsuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGggKyAyKSxcbiAgICAgIDB4NjAsIDB4MDEsIGNvZGVzLnR5cGUuaTMyLCAweDAwLFxuICAgICAgMHg2MCwgMHgwMiwgY29kZXMudHlwZS5pMzIsIGNvZGVzLnR5cGUuaTMyLCAweDAwLFxuICAgICAgLi4uZmxhdE1hcChidWlsdEZ1bmNzLCAoeyBmdW5jIH0pID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzdWx0VHlwZShmdW5jLnJlc3VsdClcbiAgICAgICAgcmV0dXJuIFsweDYwLCAuLi51MzIoZnVuYy5wYXJhbXMubGVuZ3RoKSwgLi4uZnVuYy5wYXJhbXMubWFwKHQgPT4gY29kZXMudHlwZVt0XSksIC4uLihyZXN1bHQgPT09IFwidm9pZFwiID8gWzB4MDBdIDogWzB4MDEsIGNvZGVzLnR5cGVbcmVzdWx0XV0pXVxuICAgICAgfSldKSxcbiAgICAuLi5zZWN0aW9uKDB4MDIsIFtcbiAgICAgIDB4MDMsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJ0cmFwXCIpLFxuICAgICAgMHgwMCxcbiAgICAgIDB4MDAsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJsb2dcIiksXG4gICAgICAweDAwLFxuICAgICAgMHgwMSxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcIm1lbW9yeVwiKSxcbiAgICAgIDB4MDIsXG4gICAgICAweDAzLFxuICAgICAgLi4udTMyKHBhZ2VzKSxcbiAgICAgIC4uLnUzMihwYWdlcyksXG4gICAgXSksXG4gICAgLi4uc2VjdGlvbigweDAzLCBbLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSwgLi4uZnVuY3Rpb25TZWN0aW9uXSksXG4gICAgLi4uKGdsb2JhbHMuc2l6ZSA/IHNlY3Rpb24oMHgwNiwgWy4uLnUzMihnbG9iYWxzLnNpemUpLCAuLi5bLi4uZ2xvYmFsc10uZmxhdE1hcCgoW3ZhbHVlXSkgPT4gW2NvZGVzLnR5cGVbdmFsdWUudHlwZV0sIDB4MDEsIC4uLmdsb2JhbEluaXQodmFsdWUpLCAweDBiXSldKSA6IFtdKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZXhwb3J0U2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgW1xuICAgICAgLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYywgYnVpbHQsIGxvY2FscywgbG9jYWxJbmRleGVzIH0pID0+IHtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBtYWtlQ29tcGlsZXIoZml4LCBsb2NhbEluZGV4ZXMsIGxheW91dHMsIHRyYXBzLCBsb2dzLCBnbG9iYWxzKVxuICAgICAgICBjb25zdCBkZWNscyA9IFsuLi51MzIobG9jYWxzLmxlbmd0aCksIC4uLmZsYXRNYXAobG9jYWxzLCAoWywgdHlwZV0pID0+IFsuLi51MzIoMSksIGNvZGVzLnR5cGVbdHlwZV1dKV1cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzdWx0VHlwZShmdW5jLnJlc3VsdClcbiAgICAgICAgY29uc3QgY29kZSA9IFsuLi5mbGF0TWFwKGJ1aWx0LCBzID0+IGNvbXBpbGVyLnN0bXQocykpLCAuLi4ocmVzdWx0ID09PSBcInZvaWRcIiA/IFtdIDogY29kZXMuemVyb1tyZXN1bHRdKV1cbiAgICAgICAgY29uc3QgYm9keSA9IFsuLi5kZWNscywgLi4uY29kZSwgMHgwYl1cbiAgICAgICAgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XVxuICAgICAgfSksXG4gICAgXSksXG4gIF0pXG59XG4iLAogICAgImV4cG9ydCB7XG4gIGFycmF5LCBib3VuZHNDaGVjaywgZXhwLCBmMzIsIGY2NCwgZm4sIGZvcl8sIGdsb2JhbCwgaTMyLCBpNjQsIGk2NHUsXG4gIGlmRWxzZSwgbG9nLCByZXR1cm5fLCBzdHJ1Y3QsIHRyYXAsIHZhcmlhYmxlLCB3aGVuLCB3aGlsZV8sXG59IGZyb20gXCIuL2FzdFwiXG5leHBvcnQgdHlwZSB7XG4gIEFueUFycmF5LCBBbnlGdW5jLCBBcmdzVmFsLCBBcnJheUhhbmRsZSwgQ29tcGlsZVJlc3VsdCwgRFR5cGUsIEV4cHIsIEV4cHJMaWtlLFxuICBHbG9iYWxWYWx1ZSwgSlNTdHJ1Y3QsIExvY2FsVmFyLCBNb2R1bGVEZWYsIE11dGFibGVTdHJ1Y3QsIE11dGFibGVWYWx1ZSxcbiAgTnVtVHlwZSwgU3RydWN0VHlwZSwgVmFsdWUsXG59IGZyb20gXCIuL2FzdFwiXG5leHBvcnQgeyBmb3JtYXRNb2R1bGUgfSBmcm9tIFwiLi9mb3JtYXRcIlxuXG5pbXBvcnQgeyBhbmFseXplTW9kdWxlIH0gZnJvbSBcIi4vYW5hbHl6ZVwiXG5pbXBvcnQgeyBlbWl0TW9kdWxlIH0gZnJvbSBcIi4vY29kZWdlblwiXG5pbXBvcnQgdHlwZSB7XG4gIEFueUFycmF5LCBBbnlGdW5jLCBDb21waWxlUmVzdWx0LCBKU1N0cnVjdCwgTW9kdWxlRGVmLCBTdHJ1Y3RGaWVsZHMsIFN0cnVjdFR5cGUsXG59IGZyb20gXCIuL2FzdFwiXG5cbmNvbnN0IGFycmF5Q3RvcnMgPSB7XG4gIGk4OiBJbnQ4QXJyYXksIHU4OiBVaW50OEFycmF5LCBpMTY6IEludDE2QXJyYXksIHUxNjogVWludDE2QXJyYXksXG4gIGkzMjogSW50MzJBcnJheSwgaTY0OiBCaWdJbnQ2NEFycmF5LCBmMzI6IEZsb2F0MzJBcnJheSwgZjY0OiBGbG9hdDY0QXJyYXksXG4gIHN1ODogVWludDhBcnJheSwgc3UxNjogVWludDE2QXJyYXksIHNpMzI6IFVpbnQzMkFycmF5LCBzaTY0OiBCaWdVaW50NjRBcnJheSxcbn1cblxuZXhwb3J0IGNvbnN0IGRlY29kZVN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCByYXc6IG51bWJlciB8IGJpZ2ludCk6IEpTU3RydWN0PEY+ID0+IHtcbiAgY29uc3QgcGFja2VkID0gQmlnSW50LmFzVWludE4odHlwZS5zaXplICogOCwgQmlnSW50KHJhdykpXG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXModHlwZS5sYXlvdXQpLm1hcCgoW25hbWUsIGZpZWxkXSkgPT4ge1xuICAgIGNvbnN0IG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgbGV0IHZhbHVlID0gKHBhY2tlZCA+PiBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkgJiBtYXNrXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgdmFsdWUgJiAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMgLSAxKSkpXG4gICAgICB2YWx1ZSAtPSAxbiA8PCBCaWdJbnQoZmllbGQuYml0cylcbiAgICByZXR1cm4gW25hbWUsIGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyB2YWx1ZSA6IE51bWJlcih2YWx1ZSldXG4gIH0pKSBhcyBKU1N0cnVjdDxGPlxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZSA9IGFzeW5jIDxUIGV4dGVuZHMgTW9kdWxlRGVmPihcbiAgbW9kOiBULFxuKTogUHJvbWlzZTxDb21waWxlUmVzdWx0PFQ+PiA9PiB7XG4gIGNvbnN0IGFuYWx5c2lzID0gYW5hbHl6ZU1vZHVsZShtb2QpXG4gIGNvbnN0IG1lbW9yeSA9IG5ldyBXZWJBc3NlbWJseS5NZW1vcnkoe1xuICAgIGluaXRpYWw6IGFuYWx5c2lzLnBhZ2VzLFxuICAgIG1heGltdW06IGFuYWx5c2lzLnBhZ2VzLFxuICAgIHNoYXJlZDogdHJ1ZSxcbiAgfSlcbiAgY29uc3QgY29tcGlsZWQgPSBhd2FpdCBXZWJBc3NlbWJseS5jb21waWxlKGVtaXRNb2R1bGUoYW5hbHlzaXMpLmJ1ZmZlcilcbiAgY29uc3QgdHJhcCA9IChpZDogbnVtYmVyKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYW5hbHlzaXMudHJhcE1lc3NhZ2VzW2lkXSA/PyBgVW5rbm93biBXQVNNIHRyYXAgJHtpZH1gKSB9XG4gIGNvbnN0IGxvZyA9IChpZDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiBjb25zb2xlLmxvZyhhbmFseXNpcy5sb2dNZXNzYWdlc1tpZF0gPz8gYFdBU00gbG9nICR7aWR9YCwgdmFsdWUpXG4gIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoY29tcGlsZWQsIHsgZW52OiB7IG1lbW9yeSwgdHJhcCwgbG9nIH0gfSlcbiAgY29uc3QgZnVuY0VudHJpZXMgPSBPYmplY3QuZW50cmllcyhhbmFseXNpcy5mdW5jcykgYXMgW3N0cmluZywgQW55RnVuY11bXVxuICBjb25zdCBqc0Z1bmNzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LCByZXN1bHRTdHJ1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBTdHJ1Y3RUeXBlPGFueT4+ID0ge31cbiAgZm9yIChjb25zdCBbbmFtZSwgZnVuY10gb2YgZnVuY0VudHJpZXMpIHtcbiAgICBjb25zdCB3YXNtRnVuYyA9IGluc3RhbmNlLmV4cG9ydHNbbmFtZV0gYXMgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gbnVtYmVyIHwgYmlnaW50XG4gICAganNGdW5jc1tuYW1lXSA9IHdhc21GdW5jXG4gICAgaWYgKHR5cGVvZiBmdW5jLnJlc3VsdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmVzdWx0U3RydWN0c1tuYW1lXSA9IGZ1bmMucmVzdWx0XG4gICAgICBqc0Z1bmNzW25hbWVdID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gZGVjb2RlU3RydWN0KGZ1bmMucmVzdWx0IGFzIFN0cnVjdFR5cGU8YW55Piwgd2FzbUZ1bmMoLi4uYXJncykpXG4gICAgfVxuICB9XG4gIGNvbnN0IGpzQXJyYXlzID0gKE9iamVjdC5lbnRyaWVzKGFuYWx5c2lzLmFycmF5cykgYXMgW3N0cmluZywgQW55QXJyYXldW10pLm1hcCgoW25hbWUsIGFycl0pID0+IHtcbiAgICBjb25zdCBsYXlvdXQgPSBhbmFseXNpcy5sYXlvdXRzLmdldChhcnIpIVxuICAgIGNvbnN0IGtleSA9IHR5cGVvZiBhcnIudHlwZSA9PT0gXCJzdHJpbmdcIiA/IGFyci50eXBlIDogYHMke2Fyci50eXBlLnN0b3JhZ2V9YFxuICAgIGNvbnN0IEN0b3IgPSBhcnJheUN0b3JzW2tleSBhcyBrZXlvZiB0eXBlb2YgYXJyYXlDdG9yc11cbiAgICByZXR1cm4gW25hbWUsIG5ldyBDdG9yKG1lbW9yeS5idWZmZXIsIGxheW91dC5vZmZzZXQsIGFyci5sZW5ndGgpXSBhcyBjb25zdFxuICB9KVxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihqc0Z1bmNzLCBPYmplY3QuZnJvbUVudHJpZXMoanNBcnJheXMpLCB7XG4gICAgbW9kOiBjb21waWxlZCwgbWVtb3J5LCByZXN1bHRTdHJ1Y3RzLFxuICAgIHRyYXBNZXNzYWdlczogYW5hbHlzaXMudHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlczogYW5hbHlzaXMubG9nTWVzc2FnZXMsXG4gIH0pIGFzIENvbXBpbGVSZXN1bHQ8VD5cbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgYXJyYXksIGNvbXBpbGUsIGV4cCwgZjMyLCBmbiwgZm9yXywgZ2xvYmFsLCBpMzIsIGk2NHUsIGlmRWxzZSwgbG9nLCByZXR1cm5fLCBzdHJ1Y3QsIHRyYXAsIHZhcmlhYmxlLCB3aGVuLCB0eXBlIEFueUFycmF5LCB0eXBlIEFycmF5SGFuZGxlLCB0eXBlIERUeXBlLCB0eXBlIEV4cHIsIHR5cGUgRXhwckxpa2UgfSBmcm9tIFwiLi4vd2FzbVwiXG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiXG5pbXBvcnQgeyBJTkYsIEtNX0NPU1RfQ0VOVFMsIFJFT1JHX0NPU1RfQ0VOVFMgfSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCJcblxuY29uc3QgVEVNUF9QSEFTRVMgPSAxXzAwMFxuY29uc3QgRU5EX1RFTVBfQ0VOVFMgPSAwXG5cbmV4cG9ydCB0eXBlIFdhc21TZWFyY2hQYXJhbXMgPSB7XG4gIHN0ZXBzOiBudW1iZXJcbiAgc3RhcnRUZW1wZXJhdHVyZTogbnVtYmVyXG4gIG51ZGdlUmFkaXVzOiBudW1iZXJcbiAgYXNzaWduV2VpZ2h0OiBudW1iZXJcbiAgdW5hc3NpZ25XZWlnaHQ6IG51bWJlclxuICBudWRnZVdlaWdodDogbnVtYmVyXG4gIHJlbG9jYXRlV2VpZ2h0OiBudW1iZXJcbiAgcm5nU2VlZDogbnVtYmVyXG59XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0V2FzbVNlYXJjaFBhcmFtczogV2FzbVNlYXJjaFBhcmFtcyA9IHtcbiAgc3RlcHM6IDFfNjBfMDAwLCBzdGFydFRlbXBlcmF0dXJlOiAyXzUwMCwgbnVkZ2VSYWRpdXM6IDQsXG4gIGFzc2lnbldlaWdodDogMywgdW5hc3NpZ25XZWlnaHQ6IDEsIG51ZGdlV2VpZ2h0OiAzLCByZWxvY2F0ZVdlaWdodDogMyxcbiAgcm5nU2VlZDogMSxcbn1cblxuY29uc3QgREVCVUcgPSBmYWxzZVxuXG5jb25zdCBkZWJ1ZyA9ICh0YWc6IHN0cmluZywgdmFsdWU6IEV4cHJMaWtlPFwiaTMyXCI+KTogdm9pZCA9PiB7XG4gIGlmIChERUJVRykgbG9nKHRhZywgdmFsdWUpXG59XG5cbmZ1bmN0aW9uIGNoZWNrZWRBcnJheTxUIGV4dGVuZHMgRFR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4ge1xuICBjb25zdCBhcnIgPSBhcnJheSh0eXBlLCBsZW5ndGgpIGFzIEFueUFycmF5XG4gIGlmICghREVCVUcpIHJldHVybiBhcnIgYXMgQXJyYXlIYW5kbGU8VD5cblxuICBjb25zdCB7IGF0LCBtb3ZlIH0gPSBhcnJcbiAgY29uc3QgY2hlY2tJZHggPSBmbihbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChpLCBuKSA9PiB7XG4gICAgd2hlbihpLmx0KDApLm9yKG4ubHQoMCkpLm9yKG4uYWRkKGkpLmd0KGFyci5sZW5ndGgpKSwgKCkgPT4gdHJhcChcImFycmF5IGJvdW5kcyBleGNlZWRlZFwiKSlcbiAgICByZXR1cm4gaVxuICB9KVxuICBhcnIuYXQgPSBpbmRleCA9PiBhdChjaGVja0lkeC5jYWxsKGluZGV4LCAxKSlcbiAgYXJyLm1vdmUgPSAodGFyZ2V0LCBzb3VyY2UsIGNvdW50KSA9PiB7XG4gICAgbW92ZShjaGVja0lkeC5jYWxsKHRhcmdldCwgY291bnQpLCBjaGVja0lkeC5jYWxsKHNvdXJjZSwgY291bnQpLCBjb3VudClcbiAgfVxuICByZXR1cm4gYXJyIGFzIEFycmF5SGFuZGxlPFQ+XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhbm5lYWxpbmdXYXNtKHBsYW5uZXI6IE1vZHVsZSwgb3B0aW9uczogUGFydGlhbDxXYXNtU2VhcmNoUGFyYW1zPiA9IHt9KTogUHJvbWlzZTxBbm5lYWxpbmdSZXN1bHQ+IHtcbiAgY29uc3QgcGFyYW1zID0geyAuLi5kZWZhdWx0V2FzbVNlYXJjaFBhcmFtcywgLi4ub3B0aW9ucyB9XG4gIGNvbnN0IHN0ZXBzUGVyUGhhc2UgPSBNYXRoLmZsb29yKHBhcmFtcy5zdGVwcyAvIFRFTVBfUEhBU0VTKVxuICBjb25zdCBhc3NpZ25FbmQgPSBwYXJhbXMuYXNzaWduV2VpZ2h0XG4gIGNvbnN0IHVuYXNzaWduRW5kID0gYXNzaWduRW5kICsgcGFyYW1zLnVuYXNzaWduV2VpZ2h0XG4gIGNvbnN0IG51ZGdlRW5kID0gdW5hc3NpZ25FbmQgKyBwYXJhbXMubnVkZ2VXZWlnaHRcbiAgY29uc3QgdG90YWxXZWlnaHQgPSBudWRnZUVuZCArIHBhcmFtcy5yZWxvY2F0ZVdlaWdodFxuICBjb25zdCBUU0laRSA9IE1hdGguZmxvb3IocGxhbm5lci5OUkVRUyAvIHBsYW5uZXIuTlRSQU5TICogMi41ICogMiArIDEwKVxuICBjb25zdCBOUE9JTlRTID0gcGxhbm5lci5yb2FkbWFwLnBvaW50cy5sZW5ndGhcbiAgY29uc3QgU1RPUCA9IHN0cnVjdCh7XG4gICAgcmVxX2lkOiBbXCJ1MTZcIiwgMTBdLFxuICAgIGlzX2xvYWQ6IFtcInU4XCIsIDFdLFxuICAgIGRlY2s6IFtcInU4XCIsIDFdLFxuICB9KVxuICBjb25zdCBSRVEgPSBzdHJ1Y3Qoe1xuICAgIHN0YXJ0OiBcInUxNlwiLFxuICAgIGVuZDogXCJ1MTZcIixcbiAgICB2YWx1ZTogXCJ1MTZcIixcbiAgICBkZWFkbGluZTogXCJ1MTZcIixcbiAgfSlcblxuICBjb25zdCByYW5kU3RhdGUgPSBnbG9iYWwoXCJpMzJcIiwgcGFyYW1zLnJuZ1NlZWQgfHwgMSlcbiAgY29uc3QgZGlzdHMgPSBjaGVja2VkQXJyYXkoXCJpMzJcIiwgcGxhbm5lci5SU0laRSlcbiAgY29uc3QgcmVxdWVzdHMgPSBjaGVja2VkQXJyYXkoUkVRLCBwbGFubmVyLk5SRVFTKVxuICBjb25zdCBhc3NpZ25lZCA9IGNoZWNrZWRBcnJheShcInU4XCIsIHBsYW5uZXIuTlJFUVMpXG4gIGNvbnN0IHNjaGVkdWxlID0gY2hlY2tlZEFycmF5KFNUT1AsIHBsYW5uZXIuTlRSQU5TICogVFNJWkUpXG4gIGNvbnN0IHNjaGVkX3NpemUgPSBjaGVja2VkQXJyYXkoXCJpMTZcIiwgcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHJhdGluZ3MgPSBjaGVja2VkQXJyYXkoXCJpMzJcIiwgcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHRyYW5fcG9zaXRpb25zID0gY2hlY2tlZEFycmF5KFwiaTE2XCIsIHBsYW5uZXIuTlRSQU5TKVxuXG4gIGNvbnN0IHJhbmROZXh0ID0gZm4oW10sIFwiaTMyXCIsICgpID0+IHtcbiAgICByYW5kU3RhdGUuc2V0KHJhbmRTdGF0ZS54b3IocmFuZFN0YXRlLnNobCgxMykpKVxuICAgIHJhbmRTdGF0ZS5zZXQocmFuZFN0YXRlLnhvcihyYW5kU3RhdGUuc2hyKDE3KSkpXG4gICAgcmFuZFN0YXRlLnNldChyYW5kU3RhdGUueG9yKHJhbmRTdGF0ZS5zaGwoNSkpKVxuICAgIHJldHVybiByYW5kU3RhdGVcbiAgfSlcblxuICBjb25zdCByYW5kaW50ID0gZm4oW1wiaTMyXCJdLCBcImkzMlwiLCBtYXggPT5cbiAgICBpMzIoaTY0dShyYW5kTmV4dC5jYWxsKCkpLm11bChpNjR1KG1heCkpLnNocigzMm4pKSlcblxuICBjb25zdCBhY2NlcHRBbm5lYWwgPSBmbihbXCJpMzJcIiwgXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChwcmV2aW91cywgbmV4dCwgdGVtcGVyYXR1cmUpID0+IHtcbiAgICB3aGVuKHByZXZpb3VzLmd0KG5leHQpLCAoKSA9PiB7XG4gICAgICByZXR1cm5fKHJhbmRpbnQuY2FsbCgxXzAwMF8wMDApLmx0KGkzMihleHAoXG4gICAgICAgIGYzMihuZXh0LnN1YihwcmV2aW91cykpLmRpdihmMzIodGVtcGVyYXR1cmUpKSxcbiAgICAgICkubXVsKDFfMDAwXzAwMCkpKSlcbiAgICB9KVxuICAgIHJldHVybiBpMzIoMSlcbiAgfSlcblxuICBjb25zdCByb2FkQ29zdCA9IGZuKFtcImkzMlwiLCBcImkzMlwiXSwgXCJpMzJcIiwgKGZyb20sIHRvKSA9PiB7XG4gICAgY29uc3QgbG8gPSB2YXJpYWJsZSh0by5hZGQoZnJvbS5zdWIodG8pLm11bChmcm9tLmx0KHRvKSkpKVxuICAgIGNvbnN0IGluZGV4ID0gdmFyaWFibGUoZnJvbS5hZGQodG8pLnN1YihsbykuYWRkKGxvLm11bChOUE9JTlRTKSkpXG4gICAgaW5kZXguc2V0KGluZGV4LmFkZChpbmRleC5ndChwbGFubmVyLlJTSVpFKS5tdWwoaTMyKE5QT0lOVFMgKiogMikuc3ViKGluZGV4Lm11bCgyKSkpKSlcbiAgICByZXR1cm4gZGlzdHMuYXQoaW5kZXgpLm11bChmcm9tLmVxKHRvKS5lcSgwKSlcbiAgfSlcblxuICBjb25zdCByYXRlVHJhbiA9IGZuKFtcImkzMlwiXSwgXCJpMzJcIiwgdHJhbiA9PiB7XG4gICAgY29uc3QgcmV3YXJkID0gdmFyaWFibGUoMCksIGNvc3QgPSB2YXJpYWJsZSgwKSwgZWxhcHNlZE1pbnV0ZXMgPSB2YXJpYWJsZSgwKVxuICAgIGNvbnN0IHBvcyA9IHZhcmlhYmxlKHRyYW5fcG9zaXRpb25zLmF0KHRyYW4pKVxuICAgIGNvbnN0IG9mZnNldCA9IHRyYW4ubXVsKFRTSVpFKSwgc2l6ZSA9IHZhcmlhYmxlKHNjaGVkX3NpemUuYXQodHJhbikpXG4gICAgY29uc3QgZGVjazAgPSB2YXJpYWJsZSgwKSwgZGVjazEgPSB2YXJpYWJsZSgwKSwgZGVja1NpemUwID0gdmFyaWFibGUoMCksIGRlY2tTaXplMSA9IHZhcmlhYmxlKDApXG5cbiAgICBmb3JfKDAsIHNpemUsIGkgPT4ge1xuICAgICAgY29uc3Qgc3RlcCA9IHZhcmlhYmxlKHNjaGVkdWxlLmF0KG9mZnNldC5hZGQoaSkpKVxuICAgICAgY29uc3QgcmVxID0gdmFyaWFibGUoc3RlcC5yZXFfaWQpXG4gICAgICBjb25zdCByZXF1ZXN0ID0gdmFyaWFibGUocmVxdWVzdHMuYXQocmVxKSlcbiAgICAgIGNvbnN0IG5leHRQb3MgPSB2YXJpYWJsZShpZkVsc2Uoc3RlcC5pc19sb2FkLCByZXF1ZXN0LnN0YXJ0LCByZXF1ZXN0LmVuZCkpXG4gICAgICBjb25zdCBkaXN0YW5jZSA9IHZhcmlhYmxlKHJvYWRDb3N0LmNhbGwocG9zLCBuZXh0UG9zKSlcbiAgICAgIGNvc3QuaWFkZChkaXN0YW5jZS5tdWwoS01fQ09TVF9DRU5UUykpXG4gICAgICBlbGFwc2VkTWludXRlcy5pYWRkKGRpc3RhbmNlKVxuICAgICAgcG9zLnNldChuZXh0UG9zKVxuICAgICAgY29uc3QgZGVjayA9IHZhcmlhYmxlKGlmRWxzZShzdGVwLmRlY2ssIGRlY2sxLCBkZWNrMCkpXG4gICAgICBjb25zdCBkZWNrU2l6ZSA9IHZhcmlhYmxlKGlmRWxzZShzdGVwLmRlY2ssIGRlY2tTaXplMSwgZGVja1NpemUwKSlcblxuICAgICAgd2hlbihzdGVwLmlzX2xvYWQsICgpID0+IHtcbiAgICAgICAgd2hlbihkZWNrU2l6ZS5ndCgyKSwgKCkgPT4gcmV0dXJuXygtSU5GKSlcbiAgICAgICAgZGVjay5zZXQoZGVjay5vcihyZXEuc2hsKGRlY2tTaXplLm11bCgxMCkpKSlcbiAgICAgICAgZGVja1NpemUuaWFkZCgxKVxuICAgICAgfSwgKCkgPT4ge1xuICAgICAgICBjb25zdCBmb3VuZCA9IHZhcmlhYmxlKC0xKVxuICAgICAgICB3aGVuKGRlY2tTaXplLmd0KDApLmFuZChkZWNrLmFuZCgxMDIzKS5lcShyZXEpKSwgKCkgPT4gZm91bmQuc2V0KDApKVxuICAgICAgICB3aGVuKGZvdW5kLmVxKC0xKS5hbmQoZGVja1NpemUuZ3QoMSkpLmFuZChkZWNrLnNocigxMCkuYW5kKDEwMjMpLmVxKHJlcSkpLCAoKSA9PiBmb3VuZC5zZXQoMSkpXG4gICAgICAgIHdoZW4oZm91bmQuZXEoLTEpLmFuZChkZWNrU2l6ZS5ndCgyKSkuYW5kKGRlY2suc2hyKDIwKS5hbmQoMTAyMykuZXEocmVxKSksICgpID0+IGZvdW5kLnNldCgyKSlcbiAgICAgICAgd2hlbihmb3VuZC5lcSgtMSksICgpID0+IHJldHVybl8oLUlORikpXG4gICAgICAgIGNvc3QuaWFkZChkZWNrU2l6ZS5zdWIoZm91bmQpLnN1YigxKS5tdWwoUkVPUkdfQ09TVF9DRU5UUykpXG4gICAgICAgIGNvbnN0IHNoaWZ0ID0gZm91bmQubXVsKDEwKVxuICAgICAgICBjb25zdCBsb3dlck1hc2sgPSBpMzIoMSkuc2hsKHNoaWZ0KS5zdWIoMSlcbiAgICAgICAgZGVjay5zZXQoZGVjay5hbmQobG93ZXJNYXNrKS5vcihkZWNrLnNocihzaGlmdC5hZGQoMTApKS5zaGwoc2hpZnQpKSlcbiAgICAgICAgZGVja1NpemUuaXN1YigxKVxuICAgICAgICB3aGVuKGVsYXBzZWRNaW51dGVzLmd0KHJlcXVlc3QuZGVhZGxpbmUpLmVxKDApLCAoKSA9PiByZXdhcmQuaWFkZChyZXF1ZXN0LnZhbHVlKSlcbiAgICAgIH0pXG5cbiAgICAgIHdoZW4oc3RlcC5kZWNrLFxuICAgICAgICAoKSA9PiB7IGRlY2sxLnNldChkZWNrKTsgZGVja1NpemUxLnNldChkZWNrU2l6ZSkgfSxcbiAgICAgICAgKCkgPT4geyBkZWNrMC5zZXQoZGVjayk7IGRlY2tTaXplMC5zZXQoZGVja1NpemUpIH0sXG4gICAgICApXG4gICAgfSlcbiAgICByZXR1cm4gcmV3YXJkLnN1Yihjb3N0KVxuICB9KVxuXG4gIGNvbnN0IHRyeUFzc2lnbiA9IGZuKFtcImkzMlwiXSwgXCJ2b2lkXCIsIHRlbXBlcmF0dXJlID0+IHtcbiAgICBjb25zdCB0cmFuID0gcmFuZGludC5jYWxsKHBsYW5uZXIuTlRSQU5TKVxuICAgIGNvbnN0IHJlcV9pZCA9IHJhbmRpbnQuY2FsbChwbGFubmVyLk5SRVFTKVxuICAgIGNvbnN0IHNjaGVkVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUodG9mZnNldC5hZGQodGFyZ2V0KSwgdG9mZnNldC5hZGQoc291cmNlKSwgY291bnQpLFxuICAgICAgYXQ6IChpbmRleDogRXhwcjxcImkzMlwiPikgPT4gc2NoZWR1bGUuYXQodG9mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG5cbiAgICB3aGVuKGFzc2lnbmVkLmF0KHJlcV9pZCkuZXEoMSksICgpID0+IHJldHVybl8oKSlcbiAgICBjb25zdCB0b2Zmc2V0ID0gdHJhbi5tdWwoVFNJWkUpXG4gICAgY29uc3QgdHNpemUgPSB2YXJpYWJsZShzY2hlZF9zaXplLmF0KHRyYW4pKVxuICAgIHdoZW4odHNpemUuZ3QoVFNJWkUgLSAyKSwgKCkgPT4gcmV0dXJuXygpKVxuICAgIGNvbnN0IHByZXZpb3VzU2NvcmUgPSB2YXJpYWJsZShyYXRpbmdzLmF0KHRyYW4pKVxuICAgIGNvbnN0IEEgPSByYW5kaW50LmNhbGwodHNpemUuYWRkKDEpKVxuICAgIGNvbnN0IEIgPSB2YXJpYWJsZShBLmFkZChyYW5kaW50LmNhbGwoNCkpKVxuICAgIHdoZW4oQi5ndCh0c2l6ZSksICgpID0+IEIuc2V0KHRzaXplKSlcbiAgICBzY2hlZFZpZXcubW92ZShCLmFkZCgyKSwgQiwgdHNpemUuc3ViKEIpKVxuICAgIHNjaGVkVmlldy5tb3ZlKEEuYWRkKDEpLCBBLCBCLnN1YihBKSlcbiAgICBjb25zdCB0bXAgPSByYW5kaW50LmNhbGwoMilcbiAgICBzY2hlZFZpZXcuYXQoQSkuc2V0KHsgcmVxX2lkLCBpc19sb2FkOiAxLCBkZWNrOiB0bXAgfSlcbiAgICBzY2hlZFZpZXcuYXQoQi5hZGQoMSkpLnNldCh7IHJlcV9pZCwgaXNfbG9hZDogMCwgZGVjazogdG1wIH0pXG4gICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQodHNpemUuYWRkKDIpKVxuICAgIGNvbnN0IG5leHRTY29yZSA9IHJhdGVUcmFuLmNhbGwodHJhbilcbiAgICB3aGVuKGFjY2VwdEFubmVhbC5jYWxsKHByZXZpb3VzU2NvcmUsIG5leHRTY29yZSwgdGVtcGVyYXR1cmUpLCAoKSA9PiB7XG4gICAgICBhc3NpZ25lZC5hdChyZXFfaWQpLnNldCgxKVxuICAgICAgcmF0aW5ncy5hdCh0cmFuKS5zZXQobmV4dFNjb3JlKVxuICAgIH0sICgpID0+IHtcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEEsIEEuYWRkKDEpLCBCLnN1YihBKSlcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEIsIEIuYWRkKDIpLCB0c2l6ZS5zdWIoQikpXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZSlcbiAgICB9KVxuICB9KVxuXG4gIGNvbnN0IHRyeVVuYXNzaWduID0gZm4oW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kaW50LmNhbGwocGxhbm5lci5OVFJBTlMpXG4gICAgY29uc3QgQSA9IHZhcmlhYmxlKC0xKSwgQiA9IHZhcmlhYmxlKC0xKVxuICAgIGNvbnN0IHRzaXplID0gdmFyaWFibGUoc2NoZWRfc2l6ZS5hdCh0cmFuKSlcbiAgICBjb25zdCBzY2hlZFZpZXcgPSB7XG4gICAgICBtb3ZlOiAodGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+KSA9PlxuICAgICAgICBzY2hlZHVsZS5tb3ZlKHRvZmZzZXQuYWRkKHRhcmdldCksIHRvZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHRvZmZzZXQuYWRkKGluZGV4KSksXG4gICAgfVxuXG4gICAgd2hlbih0c2l6ZS5sdCgyKSwgKCkgPT4gcmV0dXJuXygpKVxuICAgIGNvbnN0IHRvZmZzZXQgPSB0cmFuLm11bChUU0laRSlcbiAgICBjb25zdCBzZWxlY3RlZCA9IHZhcmlhYmxlKHNjaGVkVmlldy5hdChyYW5kaW50LmNhbGwodHNpemUpKSlcbiAgICBjb25zdCByZXEgPSB2YXJpYWJsZShzZWxlY3RlZC5yZXFfaWQpXG4gICAgY29uc3QgZGVjayA9IHZhcmlhYmxlKHNlbGVjdGVkLmRlY2spXG4gICAgZm9yXygwLCB0c2l6ZSwgaSA9PiB7XG4gICAgICBjb25zdCBzdGVwID0gdmFyaWFibGUoc2NoZWRWaWV3LmF0KGkpKVxuICAgICAgd2hlbihzdGVwLnJlcV9pZC5lcShyZXEpLCAoKSA9PiB3aGVuKEEuZXEoLTEpLCAoKSA9PiBBLnNldChpKSwgKCkgPT4gQi5zZXQoaSkpKVxuICAgIH0pXG4gICAgd2hlbihBLmVxKC0xKS5vcihCLmVxKC0xKSksICgpID0+IHJldHVybl8oKSlcbiAgICBjb25zdCBwcmV2aW91c1Njb3JlID0gdmFyaWFibGUocmF0aW5ncy5hdCh0cmFuKSlcbiAgICBzY2hlZFZpZXcubW92ZShBLCBBLmFkZCgxKSwgQi5zdWIoQSkuc3ViKDEpKVxuICAgIHNjaGVkVmlldy5tb3ZlKEIuc3ViKDEpLCBCLmFkZCgxKSwgdHNpemUuc3ViKEIpLnN1YigxKSlcbiAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZS5zdWIoMikpXG4gICAgY29uc3QgbmV4dFNjb3JlID0gcmF0ZVRyYW4uY2FsbCh0cmFuKVxuICAgIHdoZW4oYWNjZXB0QW5uZWFsLmNhbGwocHJldmlvdXNTY29yZSwgbmV4dFNjb3JlLCB0ZW1wZXJhdHVyZSksICgpID0+IHtcbiAgICAgIGFzc2lnbmVkLmF0KHJlcSkuc2V0KDApXG4gICAgICByYXRpbmdzLmF0KHRyYW4pLnNldChuZXh0U2NvcmUpXG4gICAgfSwgKCkgPT4ge1xuICAgICAgc2NoZWRWaWV3Lm1vdmUoQi5hZGQoMSksIEIuc3ViKDEpLCB0c2l6ZS5zdWIoQikuc3ViKDEpKVxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQS5hZGQoMSksIEEsIEIuc3ViKEEpLnN1YigxKSlcbiAgICAgIHNjaGVkVmlldy5hdChBKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMSwgZGVjayB9KVxuICAgICAgc2NoZWRWaWV3LmF0KEIpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAwLCBkZWNrIH0pXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZSlcbiAgICB9KVxuICB9KVxuXG4gIGNvbnN0IHRyeVJlbG9jYXRlID0gZm4oW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHNyYyA9IHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUyksIGRzdCA9IHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUylcbiAgICBjb25zdCBBID0gdmFyaWFibGUoLTEpLCBCID0gdmFyaWFibGUoLTEpXG4gICAgY29uc3Qgc3JjVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUoc3JjT2Zmc2V0LmFkZCh0YXJnZXQpLCBzcmNPZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHNyY09mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG4gICAgY29uc3QgZHN0VmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUoZHN0T2Zmc2V0LmFkZCh0YXJnZXQpLCBkc3RPZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KGRzdE9mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG5cbiAgICB3aGVuKHNyYy5lcShkc3QpLCAoKSA9PiByZXR1cm5fKCkpXG4gICAgY29uc3Qgc3JjU2l6ZSA9IHZhcmlhYmxlKHNjaGVkX3NpemUuYXQoc3JjKSlcbiAgICBjb25zdCBkc3RTaXplID0gdmFyaWFibGUoc2NoZWRfc2l6ZS5hdChkc3QpKVxuICAgIHdoZW4oc3JjU2l6ZS5sdCgyKS5vcihkc3RTaXplLmd0KFRTSVpFIC0gMikpLCAoKSA9PiByZXR1cm5fKCkpXG4gICAgY29uc3Qgc3JjT2Zmc2V0ID0gc3JjLm11bChUU0laRSlcbiAgICBjb25zdCBkc3RPZmZzZXQgPSBkc3QubXVsKFRTSVpFKVxuICAgIGNvbnN0IHNlbGVjdGVkID0gdmFyaWFibGUoc3JjVmlldy5hdChyYW5kaW50LmNhbGwoc3JjU2l6ZSkpKVxuICAgIGNvbnN0IHJlcSA9IHZhcmlhYmxlKHNlbGVjdGVkLnJlcV9pZClcbiAgICBjb25zdCBkZWNrID0gdmFyaWFibGUoc2VsZWN0ZWQuZGVjaylcbiAgICBmb3JfKDAsIHNyY1NpemUsIGkgPT4ge1xuICAgICAgY29uc3Qgc3RlcCA9IHZhcmlhYmxlKHNyY1ZpZXcuYXQoaSkpXG4gICAgICB3aGVuKHN0ZXAucmVxX2lkLmVxKHJlcSksICgpID0+IHdoZW4oQS5lcSgtMSksICgpID0+IEEuc2V0KGkpLCAoKSA9PiBCLnNldChpKSkpXG4gICAgfSlcbiAgICB3aGVuKEEuZXEoLTEpLm9yKEIuZXEoLTEpKSwgKCkgPT4gcmV0dXJuXygpKVxuICAgIGNvbnN0IHByZXZpb3VzU2NvcmUgPSByYXRpbmdzLmF0KHNyYykuYWRkKHJhdGluZ3MuYXQoZHN0KSlcbiAgICBzcmNWaWV3Lm1vdmUoQSwgQS5hZGQoMSksIEIuc3ViKEEpLnN1YigxKSlcbiAgICBzcmNWaWV3Lm1vdmUoQi5zdWIoMSksIEIuYWRkKDEpLCBzcmNTaXplLnN1YihCKS5zdWIoMSkpXG4gICAgc2NoZWRfc2l6ZS5hdChzcmMpLnNldChzcmNTaXplLnN1YigyKSlcbiAgICBjb25zdCBDID0gcmFuZGludC5jYWxsKGRzdFNpemUuYWRkKDEpKVxuICAgIGNvbnN0IEQgPSB2YXJpYWJsZShDLmFkZChyYW5kaW50LmNhbGwoNCkpKVxuICAgIHdoZW4oRC5ndChkc3RTaXplKSwgKCkgPT4gRC5zZXQoZHN0U2l6ZSkpXG4gICAgZHN0Vmlldy5tb3ZlKEQuYWRkKDIpLCBELCBkc3RTaXplLnN1YihEKSlcbiAgICBkc3RWaWV3Lm1vdmUoQy5hZGQoMSksIEMsIEQuc3ViKEMpKVxuICAgIGRzdFZpZXcuYXQoQykuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDEsIGRlY2sgfSlcbiAgICBkc3RWaWV3LmF0KEQuYWRkKDEpKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMCwgZGVjayB9KVxuICAgIHNjaGVkX3NpemUuYXQoZHN0KS5zZXQoZHN0U2l6ZS5hZGQoMikpXG4gICAgY29uc3QgbmV4dFNyYyA9IHJhdGVUcmFuLmNhbGwoc3JjKVxuICAgIGNvbnN0IG5leHREc3QgPSByYXRlVHJhbi5jYWxsKGRzdClcbiAgICB3aGVuKGFjY2VwdEFubmVhbC5jYWxsKHByZXZpb3VzU2NvcmUsIG5leHRTcmMuYWRkKG5leHREc3QpLCB0ZW1wZXJhdHVyZSksICgpID0+IHtcbiAgICAgIHJhdGluZ3MuYXQoc3JjKS5zZXQobmV4dFNyYylcbiAgICAgIHJhdGluZ3MuYXQoZHN0KS5zZXQobmV4dERzdClcbiAgICB9LCAoKSA9PiB7XG4gICAgICBkc3RWaWV3Lm1vdmUoQywgQy5hZGQoMSksIEQuc3ViKEMpKVxuICAgICAgZHN0Vmlldy5tb3ZlKEQsIEQuYWRkKDIpLCBkc3RTaXplLnN1YihEKSlcbiAgICAgIHNjaGVkX3NpemUuYXQoZHN0KS5zZXQoZHN0U2l6ZSlcbiAgICAgIHNyY1ZpZXcubW92ZShCLmFkZCgxKSwgQi5zdWIoMSksIHNyY1NpemUuc3ViKEIpLnN1YigxKSlcbiAgICAgIHNyY1ZpZXcubW92ZShBLmFkZCgxKSwgQSwgQi5zdWIoQSkuc3ViKDEpKVxuICAgICAgc3JjVmlldy5hdChBKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMSwgZGVjayB9KVxuICAgICAgc3JjVmlldy5hdChCKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMCwgZGVjayB9KVxuICAgICAgc2NoZWRfc2l6ZS5hdChzcmMpLnNldChzcmNTaXplKVxuICAgIH0pXG4gIH0pXG5cbiAgY29uc3QgdHJ5TnVkZ2VTdG9wID0gZm4oW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kaW50LmNhbGwocGxhbm5lci5OVFJBTlMpLCBzaXplID0gdmFyaWFibGUoc2NoZWRfc2l6ZS5hdCh0cmFuKSlcbiAgICBjb25zdCBmaXJzdCA9IHZhcmlhYmxlKDApLCBlbmQgPSB2YXJpYWJsZSgwKVxuXG4gICAgd2hlbihzaXplLmx0KDIpLCAoKSA9PiByZXR1cm5fKCkpXG4gICAgY29uc3Qgb2Zmc2V0ID0gdHJhbi5tdWwoVFNJWkUpXG4gICAgY29uc3QgZnJvbSA9IHJhbmRpbnQuY2FsbChzaXplKVxuICAgIGNvbnN0IHNlbGVjdGVkID0gdmFyaWFibGUoc2NoZWR1bGUuYXQob2Zmc2V0LmFkZChmcm9tKSkpXG4gICAgY29uc3Qgcm9sbCA9IHJhbmRpbnQuY2FsbChwYXJhbXMubnVkZ2VSYWRpdXMgKiAyKVxuICAgIGNvbnN0IHRhcmdldCA9IHZhcmlhYmxlKGZyb20uYWRkKGlmRWxzZShyb2xsLmx0KHBhcmFtcy5udWRnZVJhZGl1cyksIHJvbGwuc3ViKHBhcmFtcy5udWRnZVJhZGl1cyksIHJvbGwuc3ViKHBhcmFtcy5udWRnZVJhZGl1cyAtIDEpKSkpXG4gICAgd2hlbih0YXJnZXQubHQoMCksICgpID0+IHRhcmdldC5zZXQoMCkpXG4gICAgd2hlbih0YXJnZXQuZ3Qoc2l6ZS5zdWIoMSkpLCAoKSA9PiB0YXJnZXQuc2V0KHNpemUuc3ViKDEpKSlcbiAgICB3aGVuKHRhcmdldC5lcShmcm9tKSwgKCkgPT4gcmV0dXJuXygpKVxuICAgIHdoZW4odGFyZ2V0Lmx0KGZyb20pLFxuICAgICAgKCkgPT4geyBmaXJzdC5zZXQodGFyZ2V0KTsgZW5kLnNldChmcm9tKSB9LFxuICAgICAgKCkgPT4geyBmaXJzdC5zZXQoZnJvbS5hZGQoMSkpOyBlbmQuc2V0KHRhcmdldC5hZGQoMSkpIH0sXG4gICAgKVxuICAgIGZvcl8oZmlyc3QsIGVuZCwgaSA9PiB7XG4gICAgICBjb25zdCBjcm9zc2VkID0gdmFyaWFibGUoc2NoZWR1bGUuYXQob2Zmc2V0LmFkZChpKSkpXG4gICAgICB3aGVuKGNyb3NzZWQucmVxX2lkLmVxKHNlbGVjdGVkLnJlcV9pZCksICgpID0+IHJldHVybl8oKSlcbiAgICB9KVxuICAgIGNvbnN0IHByZXZpb3VzU2NvcmUgPSB2YXJpYWJsZShyYXRpbmdzLmF0KHRyYW4pKVxuICAgIHdoZW4odGFyZ2V0Lmx0KGZyb20pLFxuICAgICAgKCkgPT4gc2NoZWR1bGUubW92ZShvZmZzZXQuYWRkKHRhcmdldC5hZGQoMSkpLCBvZmZzZXQuYWRkKHRhcmdldCksIGZyb20uc3ViKHRhcmdldCkpLFxuICAgICAgKCkgPT4gc2NoZWR1bGUubW92ZShvZmZzZXQuYWRkKGZyb20pLCBvZmZzZXQuYWRkKGZyb20uYWRkKDEpKSwgdGFyZ2V0LnN1Yihmcm9tKSksXG4gICAgKVxuICAgIHNjaGVkdWxlLmF0KG9mZnNldC5hZGQodGFyZ2V0KSkuc2V0KHNlbGVjdGVkKVxuICAgIGNvbnN0IG5leHRTY29yZSA9IHJhdGVUcmFuLmNhbGwodHJhbilcbiAgICB3aGVuKGFjY2VwdEFubmVhbC5jYWxsKHByZXZpb3VzU2NvcmUsIG5leHRTY29yZSwgdGVtcGVyYXR1cmUpLCAoKSA9PiB7XG4gICAgICByYXRpbmdzLmF0KHRyYW4pLnNldChuZXh0U2NvcmUpXG4gICAgfSwgKCkgPT4ge1xuICAgICAgd2hlbih0YXJnZXQubHQoZnJvbSksXG4gICAgICAgICgpID0+IHNjaGVkdWxlLm1vdmUob2Zmc2V0LmFkZCh0YXJnZXQpLCBvZmZzZXQuYWRkKHRhcmdldC5hZGQoMSkpLCBmcm9tLnN1Yih0YXJnZXQpKSxcbiAgICAgICAgKCkgPT4gc2NoZWR1bGUubW92ZShvZmZzZXQuYWRkKGZyb20uYWRkKDEpKSwgb2Zmc2V0LmFkZChmcm9tKSwgdGFyZ2V0LnN1Yihmcm9tKSksXG4gICAgICApXG4gICAgICBzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGZyb20pKS5zZXQoc2VsZWN0ZWQpXG4gICAgfSlcbiAgfSlcblxuICBjb25zdCBhZGRSZXF1ZXN0ID0gZm4oW1wiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLCBcInZvaWRcIiwgKHJlcW4sIHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSkgPT4ge1xuICAgIHJlcXVlc3RzLmF0KHJlcW4pLnNldCh7IHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSB9KVxuICB9KVxuXG4gIGNvbnN0IGJvb3RzdHJhcCA9IGZuKFtdLCBcInZvaWRcIiwgKCkgPT4ge1xuICAgIGZvcl8oMCwgcGxhbm5lci5OVFJBTlMsIHRyYW4gPT4ge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gdHJhbi5tdWwoVFNJWkUpXG4gICAgICBjb25zdCBiZXN0UmVxID0gdmFyaWFibGUoLTEpLCBiZXN0U2NvcmUgPSB2YXJpYWJsZSgtSU5GKSwgc2NvcmUgPSB2YXJpYWJsZSgwKVxuICAgICAgZm9yXygwLCBwbGFubmVyLk5SRVFTLCByZXEgPT4ge1xuICAgICAgICB3aGVuKGFzc2lnbmVkLmF0KHJlcSkuZXEoMCksICgpID0+IHtcbiAgICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAxLCBkZWNrOiAwIH0pXG4gICAgICAgICAgc2NoZWR1bGUuYXQob2Zmc2V0LmFkZCgxKSkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDAsIGRlY2s6IDAgfSlcbiAgICAgICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCgyKVxuICAgICAgICAgIHNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKVxuICAgICAgICAgIHdoZW4oc2NvcmUuZ3QoYmVzdFNjb3JlKSwgKCkgPT4geyBiZXN0U2NvcmUuc2V0KHNjb3JlKTsgYmVzdFJlcS5zZXQocmVxKSB9KVxuICAgICAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KDApXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgd2hlbihiZXN0UmVxLmd0KC0xKS5hbmQoYmVzdFNjb3JlLmd0KC0xMl8wMDEpKSwgKCkgPT4ge1xuICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQpLnNldCh7IHJlcV9pZDogYmVzdFJlcSwgaXNfbG9hZDogMSwgZGVjazogMCB9KVxuICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQuYWRkKDEpKS5zZXQoeyByZXFfaWQ6IGJlc3RSZXEsIGlzX2xvYWQ6IDAsIGRlY2s6IDAgfSlcbiAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQoMilcbiAgICAgICAgYXNzaWduZWQuYXQoYmVzdFJlcSkuc2V0KDEpXG4gICAgICAgIHJhdGluZ3MuYXQodHJhbikuc2V0KGJlc3RTY29yZSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBjb25zdCBzZWFyY2ggPSBmbihbXSwgXCJ2b2lkXCIsICgpID0+IHtcbiAgICBkZWJ1ZyhcImRlYnVnZ2VyIG9uLlwiLCAwKVxuICAgIGZvcl8oMCwgVEVNUF9QSEFTRVMsIHBoYXNlID0+IHtcbiAgICAgIGNvbnN0IHRlbXBlcmF0dXJlID0gaTMyKHBhcmFtcy5zdGFydFRlbXBlcmF0dXJlKS5zdWIoXG4gICAgICAgIHBoYXNlLm11bChwYXJhbXMuc3RhcnRUZW1wZXJhdHVyZSAtIEVORF9URU1QX0NFTlRTKS5kaXYoVEVNUF9QSEFTRVMgLSAxKSxcbiAgICAgIClcbiAgICAgIGZvcl8oMCwgc3RlcHNQZXJQaGFzZSwgKCkgPT4ge1xuICAgICAgICBjb25zdCBtb3ZlID0gcmFuZGludC5jYWxsKHRvdGFsV2VpZ2h0KVxuICAgICAgICB3aGVuKG1vdmUubHQoYXNzaWduRW5kKSwgKCkgPT4gdHJ5QXNzaWduLmNhbGwodGVtcGVyYXR1cmUpLCAoKSA9PiB7XG4gICAgICAgICAgd2hlbihtb3ZlLmx0KHVuYXNzaWduRW5kKSwgKCkgPT4gdHJ5VW5hc3NpZ24uY2FsbCh0ZW1wZXJhdHVyZSksICgpID0+IHtcbiAgICAgICAgICAgIHdoZW4obW92ZS5sdChudWRnZUVuZCksICgpID0+IHRyeU51ZGdlU3RvcC5jYWxsKHRlbXBlcmF0dXJlKSwgKCkgPT4gdHJ5UmVsb2NhdGUuY2FsbCh0ZW1wZXJhdHVyZSkpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBjb25zdCBnZXRTdG9wID0gZm4oW1wiaTMyXCIsIFwiaTMyXCJdLCBTVE9QLFxuICAgICh0cmFuLCBpbmRleCkgPT4gc2NoZWR1bGUuYXQodHJhbi5tdWwoVFNJWkUpLmFkZChpbmRleCkpKVxuXG4gIGNvbnN0IHdhc20gPSBhd2FpdCBjb21waWxlKHtcbiAgICBhZGRSZXF1ZXN0LFxuICAgIGFzc2lnbmVkLFxuICAgIGJvb3RzdHJhcCxcbiAgICBkaXN0cyxcbiAgICBnZXRTdG9wLFxuICAgIHJhdGVUcmFuLFxuICAgIHJhdGluZ3MsXG4gICAgc2NoZWR1bGUsXG4gICAgc2VhcmNoLFxuICAgIHNjaGVkX3NpemUsXG4gICAgdHJhbl9wb3NpdGlvbnMsXG4gIH0pXG5cbiAgd2FzbS5kaXN0cy5zZXQocGxhbm5lci5yb2FkbWFwLkNvc3RNYXRyaXgpXG4gIHdhc20udHJhbl9wb3NpdGlvbnMuc2V0KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpXG4gIHBsYW5uZXIucmVxdWVzdHMuZm9yRWFjaCgocmVxdWVzdCwgaSkgPT5cbiAgICB3YXNtLmFkZFJlcXVlc3QoaSwgcmVxdWVzdC5zdGFydFBvaW50LCByZXF1ZXN0LmVuZFBvaW50LCBNYXRoLnJvdW5kKHJlcXVlc3QudmFsdWVfZXVyICogMTAwKSwgTWF0aC5mbG9vcihyZXF1ZXN0LmRlYWRsaW5lX2ggKiA2MCkpLFxuICApXG5cbiAgd2FzbS5ib290c3RyYXAoKVxuICBjb25zdCBzdGFydGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICB3YXNtLnNlYXJjaCgpXG4gIGNvbnN0IGVsYXBzZWRNcyA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRlZEF0XG4gIGNvbnN0IHJlc3VsdFNjaGVkdWxlID0gbmV3IFVpbnQzMkFycmF5KHBsYW5uZXIuTlRSQU5TICogVFNJWkUpXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgcGxhbm5lci5OVFJBTlM7IHRyYW4rKykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2FzbS5zY2hlZF9zaXplW3RyYW5dITsgaSsrKSB7XG4gICAgICBjb25zdCBzdG9wID0gd2FzbS5nZXRTdG9wKHRyYW4sIGkpXG4gICAgICByZXN1bHRTY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSA9IHN0b3AuaXNfbG9hZCB8IHN0b3AuZGVjayA8PCAxIHwgc3RvcC5yZXFfaWQgPDwgMlxuICAgIH1cbiAgfVxuICBjb25zdCB1bmFzc2lnbmVkID0gbmV3IEludDhBcnJheShwbGFubmVyLk5SRVFTKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHVuYXNzaWduZWQubGVuZ3RoOyBpKyspIHVuYXNzaWduZWRbaV0gPSB3YXNtLmFzc2lnbmVkW2ldID8gMCA6IDFcbiAgY29uc3Qgc2NoZWR1bGVSYXRpbmdzID0gbmV3IEludDMyQXJyYXkod2FzbS5yYXRpbmdzKVxuXG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGU6IHJlc3VsdFNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IG5ldyBVaW50MTZBcnJheSh3YXNtLnNjaGVkX3NpemUpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpLFxuICAgIFRTSVpFLFxuICAgIHNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiBzY2hlZHVsZVJhdGluZ3MucmVkdWNlKChzdW0sIHNjb3JlKSA9PiBzdW0gKyBzY29yZSwgMCksXG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgYnV0dG9uLCBjb2xvciwgZGl2LCBwLCBwb3B1cCwgc2VsZWN0LCBzcGFuLCBzdHlsZSwgdGFibGUsIHRkLCB0aCwgdHIgfSBmcm9tIFwiLi4vdmlldy9odG1sXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMgfSBmcm9tIFwiLi4vdmlldy9tYWluXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZywgdHlwZSBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi9hbm5lYWxpbmdfYmFzZWxpbmVcIjtcbmltcG9ydCB7IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiwgaW1wcm92ZWRBbm5lYWxpbmcsIHR5cGUgSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIH0gZnJvbSBcIi4vYW5uZWFsaW5nX2ltcHJvdmVkXCI7XG5pbXBvcnQgeyBhbm5lYWxpbmdXYXNtIH0gZnJvbSBcIi4vYW5uZWFsaW5nX3dhc21cIjtcbmltcG9ydCB7IEFWR19TUEVFRF9LTUgsIGdldERlY2ssIGdldFJlcSwgaW5pdEFubmVhbGluZ1N0YXRlLCBpc0xvYWQsIEtNX0NPU1RfQ0VOVFMsIFJFT1JHX0NPU1RfQ0VOVFMsIHNjb3JlUm91dGUgfSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCBjb25zdCBhdmFpbGFibGVTb2x2ZXJzID0ge1xuICB3YXNtOiBhbm5lYWxpbmdXYXNtLFxuICBiYXNlbGluZTogYmFzZWxpbmVBbm5lYWxpbmcsXG4gIGltcHJvdmVkOiBpbXByb3ZlZEFubmVhbGluZyxcbn0gYXMgY29uc3Q7XG50eXBlIFNvbHZlck5hbWUgPSBrZXlvZiB0eXBlb2YgYXZhaWxhYmxlU29sdmVycztcblxuY29uc3QgSU5JVElBTF9TT0xWRVI6IFNvbHZlck5hbWUgPSBcIndhc21cIjtcbmNvbnN0IGV1cm9zID0gKGNlbnRzOiBudW1iZXIpID0+IGAkeyhjZW50cyAvIDEwMCkudG9GaXhlZCgyKX3igqxgO1xuXG5jbGFzcyBTY29yZU1pc21hdGNoRXJyb3IgZXh0ZW5kcyBFcnJvciB7fVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTY2hlZHVsZShtb2Q6IE1vZHVsZSwgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQpIHtcbiAgY29uc3Qgc2NoZWR1bGUgPSBuZXcgVWludDMyQXJyYXkocmVzdWx0LnNjaGVkdWxlKVxuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IG1vZC5OVFJBTlM7IHRyYW4rKykge1xuICAgIGNvbnN0IHNpemUgPSByZXN1bHQuc2NoZWR1bGVTaXplc1t0cmFuXSFcbiAgICBpZiAoc2l6ZSA8IDAgfHwgc2l6ZSA+IHJlc3VsdC5UU0laRSkgdGhyb3cgbmV3IFNjb3JlTWlzbWF0Y2hFcnJvcihgVHJhbnNwb3J0ZXIgJHt0cmFufSBoYXMgaW52YWxpZCBzY2hlZHVsZSBzaXplICR7c2l6ZX1gKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICBjb25zdCBhdCA9IHRyYW4gKiByZXN1bHQuVFNJWkUgKyBpXG4gICAgICBjb25zdCBzdGVwID0gc2NoZWR1bGVbYXRdXG4gICAgICBpZiAoc3RlcCA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKGBUcmFuc3BvcnRlciAke3RyYW59IHNjaGVkdWxlIGlzIHRydW5jYXRlZCBhdCAke2l9YClcbiAgICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKSwgcmVxdWVzdCA9IG1vZC5yZXF1ZXN0c1tyZXFdXG4gICAgICBpZiAoIXJlcXVlc3QpIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRyYW5zcG9ydGVyICR7dHJhbn0gcmVmZXJlbmNlcyB1bmtub3duIHJlcXVlc3QgJHtyZXF9YClcbiAgICAgIGNvbnN0IHBvcyA9IGlzTG9hZChzdGVwKSA/IHJlcXVlc3Quc3RhcnRQb2ludCA6IHJlcXVlc3QuZW5kUG9pbnRcbiAgICAgIHNjaGVkdWxlW2F0XSA9IChzdGVwICYgMHhmZmZmKSB8IHBvcyA8PCAxNlxuICAgIH1cbiAgfVxuICByZXR1cm4gc2NoZWR1bGVcbn1cblxuZnVuY3Rpb24gY2hlY2tlZFJlc3VsdChtb2Q6IE1vZHVsZSwgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQpIHtcbiAgaWYgKHJlc3VsdC5zY2hlZHVsZVNpemVzLmxlbmd0aCAhPT0gbW9kLk5UUkFOUyB8fCByZXN1bHQuc2NoZWR1bGVSYXRpbmdzLmxlbmd0aCAhPT0gbW9kLk5UUkFOUylcbiAgICB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKFwiU29sdmVyIHJldHVybmVkIGluY29ycmVjdGx5IHNpemVkIHRyYW5zcG9ydGVyIGFycmF5c1wiKVxuICBjb25zdCBzY2hlZHVsZSA9IGNhbm9uaWNhbFNjaGVkdWxlKG1vZCwgcmVzdWx0KVxuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QpXG4gIE9iamVjdC5hc3NpZ24oc3RhdGUsIHtcbiAgICBUU0laRTogcmVzdWx0LlRTSVpFLFxuICAgIHNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHJlc3VsdC5zY2hlZHVsZVNpemVzLFxuICAgIHNjaGVkdWxlUmF0aW5nczogcmVzdWx0LnNjaGVkdWxlUmF0aW5ncyxcbiAgICB0cmFuU3RhcnQ6IHJlc3VsdC50cmFuU3RhcnQsXG4gICAgdW5hc3NpZ25lZDogcmVzdWx0LnVuYXNzaWduZWQsXG4gIH0pXG4gIGxldCB0b3RhbCA9IDBcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBtb2QuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBleHBlY3RlZCA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pLCByZXBvcnRlZCA9IHJlc3VsdC5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hXG4gICAgaWYgKHJlcG9ydGVkICE9PSBleHBlY3RlZClcbiAgICAgIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRyYW5zcG9ydGVyICR7dHJhbn0gc2NvcmUgbWlzbWF0Y2g6IHJlcG9ydGVkICR7cmVwb3J0ZWR9LCBKUyAke2V4cGVjdGVkfWApXG4gICAgdG90YWwgKz0gZXhwZWN0ZWRcbiAgfVxuICBpZiAocmVzdWx0LnRvdGFsU2NvcmUgIT09IHRvdGFsKVxuICAgIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRvdGFsIHNjb3JlIG1pc21hdGNoOiByZXBvcnRlZCAke3Jlc3VsdC50b3RhbFNjb3JlfSwgSlMgJHt0b3RhbH1gKVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwbGFubmVyVmlldyhtb2Q6IE1vZHVsZSk6IFByb21pc2U8SFRNTEVsZW1lbnQ+IHtcbiAgY29uc3Qgb3V0ZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmdyYXk7XG4gIGNvbnN0IGNlbGxQYWRkaW5nID0gXCIuMzVlbSAuNWVtXCI7XG5cbiAgbGV0IGFubmVhbGVyOiBBbm5lYWxpbmdSZXN1bHQgfCBudWxsID0gbnVsbDtcbiAgbGV0IGFubmVhbGluZ1Nlc3Npb246IEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB8IG51bGwgPSBudWxsO1xuICBsZXQgYW5uZWFsaW5nVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBsZXQgcnVuSWQgPSAwO1xuXG4gIGZ1bmN0aW9uIGl0ZW1CdXR0b24oaXRlbTogbnVtYmVyLCBsb2FkPzogYm9vbGVhbiwgZGVjaz86IG51bWJlcikge1xuICAgIGNvbnN0IHJlcSA9IG1vZC5yZXF1ZXN0c1tpdGVtXSE7XG4gICAgY29uc3QgcmVxdWVzdEJ1dHRvbiA9IHNwYW4oXG4gICAgICBpdGVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMywgXCIgXCIpLFxuICAgICAgc3R5bGUoe1xuICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICBkaXNwbGF5OiBcImlubGluZS1ibG9ja1wiLFxuICAgICAgICBwYWRkaW5nOiBcIi4xNWVtIC4zNWVtXCIsXG4gICAgICAgIGNvbG9yOiBsb2FkID09PSB0cnVlID8gY29sb3IuYmx1ZSA6IGxvYWQgPT09IGZhbHNlID8gY29sb3IuZ3JlZW4gOiBjb2xvci5jb2xvcixcbiAgICAgICAgd2hpdGVTcGFjZTogXCJwcmVcIixcbiAgICAgICAgZm9udEZhbWlseTogXCJtb25vc3BhY2VcIixcbiAgICAgIH0pLFxuICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICBwb3B1cChcbiAgICAgICAgICBwKFwiaXRlbSBcIiwgaXRlbSksXG4gICAgICAgICAgdGFibGUoXG4gICAgICAgICAgICB0cihjZWxsKFwic3RhdHVzXCIpLCBjZWxsKGxvYWQgPyBcImxvYWRcIiA6IGxvYWQgPT09IGZhbHNlID8gXCJ1bmxvYWRcIiA6IFwidW5hc3NpZ25lZFwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwidmFsdWVcIiksIGNlbGwocmVxLnZhbHVlX2V1ciArIFwi4oKsXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJkaXN0XCIpLCBjZWxsKG1vZC5yb2FkbWFwLmdldENvc3ROKHJlcS5zdGFydFBvaW50LCByZXEuZW5kUG9pbnQpICsgXCJrbVwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwiZGVhZGxpbmVcIiksIGNlbGwocmVxLmRlYWRsaW5lX2gudG9GaXhlZCgyKSArIFwiaFwiKSksXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGxldCBwb2ludHMgPSBbXG4gICAgICB7IG51bWJlcjogcmVxLnN0YXJ0UG9pbnQsIGxvZ286IFwi8J+TplwiIH0sXG4gICAgICB7IG51bWJlcjogcmVxLmVuZFBvaW50LCBsb2dvOiBcIvCfj6BcIiB9LFxuICAgIF07XG5cbiAgICBpZiAobG9hZCA9PT0gdHJ1ZSkgcG9pbnRzID0gW3BvaW50c1swXSFdO1xuICAgIGlmIChsb2FkID09PSBmYWxzZSkgcG9pbnRzID0gW3BvaW50c1sxXSFdO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gZGVjayA9PT0gdW5kZWZpbmVkXG4gICAgICA/IHNwYW4ocmVxdWVzdEJ1dHRvbiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBib3JkZXJSYWRpdXM6IFwiLjI1ZW1cIiwgYmFja2dyb3VuZDogY29sb3IubGlnaHRncmF5IH0pKVxuICAgICAgOiBkaXYoXG4gICAgICAgICAgWzAsIDFdLm1hcChkZWNrSW5kZXggPT4gZGl2KFxuICAgICAgICAgICAgZGVja0luZGV4ID09PSBkZWNrID8gcmVxdWVzdEJ1dHRvbiA6IFwiXFx1MDBhMFwiLFxuICAgICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgICAgICAgICBtaW5XaWR0aDogXCIzLjFlbVwiLFxuICAgICAgICAgICAgICBtaW5IZWlnaHQ6IFwiMS41NWVtXCIsXG4gICAgICAgICAgICAgIHRleHRBbGlnbjogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgYm9yZGVyVG9wOiBkZWNrSW5kZXggPT09IDEgPyBvdXRlckJvcmRlciA6IFwibm9uZVwiLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSksXG4gICAgICAgICAgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBib3JkZXJSYWRpdXM6IFwiLjJlbVwiLCBvdmVyZmxvdzogXCJoaWRkZW5cIiB9KSxcbiAgICAgICAgKTtcblxuICAgIHJlc3VsdC5vbm1vdXNlZW50ZXIgPSAoKSA9PiB7XG4gICAgICByZXN1bHQuc3R5bGUub3V0bGluZSA9IGAycHggc29saWQgJHtjb2xvci5ncmVlbn1gO1xuICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50cyB9XSk7XG4gICAgfTtcbiAgICByZXN1bHQub25tb3VzZWxlYXZlID0gKCkgPT4ge1xuICAgICAgcmVzdWx0LnN0eWxlLm91dGxpbmUgPSBcIm5vbmVcIjtcbiAgICAgIGhpZ2h0TGlnaHRzLnNldChbXSk7XG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgY29uc3QgY2VsbDogdHlwZW9mIHRkID0gKC4uLngpID0+IHRkKHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksIC4uLngpO1xuICBjb25zdCBjb250cm9scyA9IGRpdihzdHlsZSh7IGRpc3BsYXk6IFwiZmxleFwiLCBnYXA6IFwiLjVlbVwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBmbGV4V3JhcDogXCJ3cmFwXCIgfSkpO1xuICBjb25zdCBzY29yZUxpbmUgPSBwKCk7XG4gIGNvbnN0IHRpbWVMaW5lID0gcCgpO1xuICBjb25zdCBzb2x2ZXJTZWxlY3QgPSBzZWxlY3QoLi4uT2JqZWN0LmtleXMoYXZhaWxhYmxlU29sdmVycykgYXMgU29sdmVyTmFtZVtdKTtcbiAgY29uc3Qgc29sdmVyTGluZSA9IHAoXCJzb2x2ZXI6IFwiLCBzb2x2ZXJTZWxlY3QpO1xuXG5cbiAgY29uc3QgZGV0YWlsV3JhcCA9IGRpdigpO1xuICBjb25zdCB0YWJsZVdyYXAgPSBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgb3ZlcmZsb3dYOiBcImF1dG9cIixcbiAgICAgIG92ZXJmbG93WTogXCJoaWRkZW5cIixcbiAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICB9KSxcbiAgKTtcblxuICBjb25zdCBydW5CdXR0b24gPSBidXR0b24oXCJzdGFydFwiKTtcbiAgY29uc3QgaGVhdEJ1dHRvbiA9IGJ1dHRvbihcImhlYXQgdXBcIik7XG4gIGxldCByZW5kZXJDb3VudGVyID0gMDtcblxuICBmdW5jdGlvbiBzdG9wU2VhcmNoKCkge1xuICAgIGlmIChhbm5lYWxpbmdUaW1lciAhPSBudWxsKSB7XG4gICAgICBjbGVhckludGVydmFsKGFubmVhbGluZ1RpbWVyKTtcbiAgICAgIGFubmVhbGluZ1RpbWVyID0gbnVsbDtcbiAgICB9XG4gICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gXCJzdGFydFwiO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyVGFibGUoKSB7XG4gICAgY29uc3QgdGFiID0gdGFibGUoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgICAgdGFibGVMYXlvdXQ6IFwiZml4ZWRcIixcbiAgICAgIH0pLFxuICAgICAgdHIoXG4gICAgICAgIHRoKFwidHJhbnNwb3J0ZXJcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiwgd2lkdGg6IFwiOGVtXCIgfSkpLFxuICAgICAgICB0aChcInZhbHVlXCIsIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHRleHRBbGlnbjogXCJyaWdodFwiLCB3aWR0aDogXCI3ZW1cIiB9KSksXG4gICAgICAgIHRoKFwic3RlcHNcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICApLFxuICAgICAgbW9kLnN0YXJ0cG9zaXRpb25zLm1hcCgoc3RhcnQsIHRyYW4pID0+XG4gICAgICAgIHRyKFxuICAgICAgICAgIGNlbGwoXG4gICAgICAgICAgICB0cmFuLFxuICAgICAgICAgICAgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcG9wdXAoXG4gICAgICAgICAgICAgICAgcChcInRyYW5zcG9ydGVyOiBcIiwgdHJhbiksXG4gICAgICAgICAgICAgICAgcChcInN0YXJ0OiBcIiwgc3RhcnQpLFxuICAgICAgICAgICAgICAgIHAoXCJzY29yZTogXCIsIGV1cm9zKGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0gPz8gMCkpLFxuICAgICAgICAgICAgICAgIHAoXCJzdGVwczogXCIsIGFubmVhbGVyPy5zY2hlZHVsZVNpemVzW3RyYW5dISksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvbm1vdXNlZW50ZXI6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwb2ludHMgPSBbeyBudW1iZXI6IHN0YXJ0LCBsb2dvOiBcIvCfmptcIiB9XTtcbiAgICAgICAgICAgICAgICBpZiAoYW5uZWFsZXIpIHtcbiAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYW5uZWFsZXIuc2NoZWR1bGVTaXplc1t0cmFuXSE7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGVwID0gYW5uZWFsZXIuc2NoZWR1bGVbdHJhbiAqIGFubmVhbGVyLlRTSVpFICsgaV0hO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gbW9kLnJlcXVlc3RzW2dldFJlcShzdGVwKV0hO1xuICAgICAgICAgICAgICAgICAgICBwb2ludHMucHVzaCh7IG51bWJlcjogaXNMb2FkKHN0ZXApID8gcmVxdWVzdC5zdGFydFBvaW50IDogcmVxdWVzdC5lbmRQb2ludCwgbG9nbzogXCJcIiB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50cyB9XSk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG9ubW91c2VsZWF2ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGhpZ2h0TGlnaHRzLnNldChbXSk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICksXG4gICAgICAgICAgdGQoZXVyb3MoYW5uZWFsZXI/LnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA/PyAwKSwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcInJpZ2h0XCIsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSkpLFxuICAgICAgICAgIHRkKFxuICAgICAgICAgICAgZGl2KFxuICAgICAgICAgICAgICBBcnJheS5mcm9tKHsgbGVuZ3RoOiBhbm5lYWxlcj8uc2NoZWR1bGVTaXplc1t0cmFuXSEgPz8gMCB9LCAoXywgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0ZXAgPSBhbm5lYWxlciEuc2NoZWR1bGVbdHJhbiAqIGFubmVhbGVyIS5UU0laRSArIGldIVxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtQnV0dG9uKGdldFJlcShzdGVwKSwgISFpc0xvYWQoc3RlcCksIGdldERlY2soc3RlcCkpXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICAgICAgICAgICAgZmxleFdyYXA6IFwid3JhcFwiLFxuICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6IFwiZmxleC1zdGFydFwiLFxuICAgICAgICAgICAgICAgIGdhcDogXCIuM2VtXCIsXG4gICAgICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjMuMWVtXCIsXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgKSxcbiAgICApO1xuXG4gICAgdGFibGVXcmFwLnJlcGxhY2VDaGlsZHJlbih0YWIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyU3RhdHVzKCkge1xuICAgIGlmICghYW5uZWFsZXIpIHJldHVybjtcbiAgICBzY29yZUxpbmUudGV4dENvbnRlbnQgPSBgc2NvcmU6ICR7ZXVyb3MoYW5uZWFsZXIudG90YWxTY29yZSl9YDtcbiAgICB0aW1lTGluZS50ZXh0Q29udGVudCA9IGBzZWFyY2ggdGltZTogJHsoYW5uZWFsZXIhLmVsYXBzZWRNcy8xMDAwKS50b0ZpeGVkKDIpfSBzYDtcblxuICAgIGRldGFpbFdyYXAucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgZGl2KFxuICAgICAgICBwKFwiZGV0YWlsc1wiKSxcbiAgICAgICAgdGFibGUoXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0cihjZWxsKFwidW5hc3NpZ25lZCByZXF1ZXN0c1wiKSwgY2VsbChBcnJheS5mcm9tKGFubmVhbGVyIS51bmFzc2lnbmVkKS5tYXAoKHgsIGkpID0+ICh7IHgsIGkgfSkpLmZpbHRlcigoeCkgPT4geC54KS5mbGF0TWFwKCh4KSA9PiBbc3BhbihcIiBcIiksIGl0ZW1CdXR0b24oeC5pKV0pKSksXG4gICAgICAgICAgdHIoY2VsbChcInNlYXJjaCB0aW1lXCIpLCBjZWxsKGAke2FubmVhbGVyPy5lbGFwc2VkTXMgPz8gMH1tc2ApKSxcbiAgICAgICAgICB0cihjZWxsKFwic2NvcmVcIiksIGNlbGwoZXVyb3MoYW5uZWFsZXIudG90YWxTY29yZSkpKSxcbiAgICAgICAgICB0cihjZWxsKFwidHJhbnNwb3J0ZXIgY291bnRcIiksIGNlbGwobW9kLk5UUkFOUykpLFxuICAgICAgICAgIHRyKGNlbGwoXCJyZXF1ZXN0IGNvdW50XCIpLCBjZWxsKG1vZC5OUkVRUykpLFxuICAgICAgICAgIHRyKGNlbGwoXCJjb3N0IHBlciBrbVwiKSwgY2VsbChldXJvcyhLTV9DT1NUX0NFTlRTKSkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJhdmVyYWdlIHNwZWVkXCIpLCBjZWxsKGAke0FWR19TUEVFRF9LTUh9a20vaGApKSxcbiAgICAgICAgICB0cihjZWxsKFwicmVvcmdhbml6YXRpb24gY29zdFwiKSwgY2VsbChldXJvcyhSRU9SR19DT1NUX0NFTlRTKSkpLFxuICAgICAgICApLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyKGZvcmNlVGFibGUgPSBmYWxzZSkge1xuICAgIGlmICghYW5uZWFsZXIpIHJldHVybjtcbiAgICByZW5kZXJTdGF0dXMoKTtcbiAgICBpZiAoZm9yY2VUYWJsZSB8fCAocmVuZGVyQ291bnRlcisrICUgNCA9PT0gMCkpIHJlbmRlclRhYmxlKCk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBydW5Tb2x2ZXIobmFtZTogU29sdmVyTmFtZSkge1xuICAgIHN0b3BTZWFyY2goKTtcbiAgICBjb25zdCBpZCA9ICsrcnVuSWQ7XG4gICAgYW5uZWFsaW5nU2Vzc2lvbiA9IG51bGw7XG4gICAgYW5uZWFsZXIgPSBudWxsO1xuICAgIHJ1bkJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gXCJydW5uaW5n4oCmXCI7XG4gICAgdGFibGVXcmFwLnJlcGxhY2VDaGlsZHJlbigpO1xuICAgIGxldCByZXN1bHQ6IEFubmVhbGluZ1Jlc3VsdCB8IG51bGwgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBpZiAobmFtZSA9PT0gXCJpbXByb3ZlZFwiKSB7XG4gICAgICAgIGFubmVhbGluZ1Nlc3Npb24gPSBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kLCAxNTBfMDAwKTtcbiAgICAgICAgcmVzdWx0ID0gYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoNDIwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IGF2YWlsYWJsZVNvbHZlcnNbbmFtZV0obW9kKTtcbiAgICAgIH1cbiAgICAgIGFubmVhbGVyID0gY2hlY2tlZFJlc3VsdChtb2QsIHJlc3VsdCk7XG4gICAgICBpZiAoaWQgPT09IHJ1bklkKSB7XG4gICAgICAgIHJlbmRlcih0cnVlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgU2NvcmVNaXNtYXRjaEVycm9yKSB0aHJvdyBlcnJvcjtcbiAgICAgIGlmIChpZCA9PT0gcnVuSWQpIHNjb3JlTGluZS50ZXh0Q29udGVudCA9IGBzb2x2ZXIgZmFpbGVkOiAke1N0cmluZyhlcnJvcil9YDtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGlkID09PSBydW5JZCkge1xuICAgICAgICBydW5CdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gbmFtZSA9PT0gXCJpbXByb3ZlZFwiID8gXCJzdGFydFwiIDogXCJydW5cIjtcbiAgICAgICAgaGVhdEJ1dHRvbi5oaWRkZW4gPSBuYW1lICE9PSBcImltcHJvdmVkXCI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcnVuQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgY29uc3QgbmFtZSA9IHNvbHZlclNlbGVjdC52YWx1ZSBhcyBTb2x2ZXJOYW1lO1xuICAgIGlmIChuYW1lICE9PSBcImltcHJvdmVkXCIpIHtcbiAgICAgIHZvaWQgcnVuU29sdmVyKG5hbWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoYW5uZWFsaW5nVGltZXIgIT0gbnVsbCkge1xuICAgICAgc3RvcFNlYXJjaCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0b3BcIjtcbiAgICBhbm5lYWxpbmdUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoIWFubmVhbGluZ1Nlc3Npb24pIHJldHVybjtcbiAgICAgIGFubmVhbGVyID0gY2hlY2tlZFJlc3VsdChtb2QsIGFubmVhbGluZ1Nlc3Npb24uaXRlcmF0ZUZvck1zKDEyMCkpO1xuICAgICAgcmVuZGVyKCk7XG4gICAgfSwgMTUwKTtcbiAgfTtcblxuICBoZWF0QnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgaWYgKCFhbm5lYWxpbmdTZXNzaW9uKSByZXR1cm47XG4gICAgYW5uZWFsZXIgPSBjaGVja2VkUmVzdWx0KG1vZCwgYW5uZWFsaW5nU2Vzc2lvbi5yZWhlYXQoKSk7XG4gICAgcmVuZGVyKHRydWUpO1xuICB9O1xuXG4gIHNvbHZlclNlbGVjdC5vbmNoYW5nZSA9ICgpID0+IHZvaWQgcnVuU29sdmVyKHNvbHZlclNlbGVjdC52YWx1ZSBhcyBTb2x2ZXJOYW1lKTtcbiAgY29udHJvbHMucmVwbGFjZUNoaWxkcmVuKHJ1bkJ1dHRvbiwgaGVhdEJ1dHRvbik7XG4gIGF3YWl0IHJ1blNvbHZlcihJTklUSUFMX1NPTFZFUik7XG5cbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBwYWRkaW5nOiBcIjFlbVwiLFxuICAgICAgb3ZlcmZsb3dZOiBcImF1dG9cIixcbiAgICAgIG92ZXJmbG93WDogXCJoaWRkZW5cIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICB9KSxcbiAgICBjb250cm9scyxcbiAgICBzb2x2ZXJMaW5lLFxuICAgIHNjb3JlTGluZSxcbiAgICB0aW1lTGluZSxcbiAgICB0YWJsZVdyYXAsXG4gICAgZGV0YWlsV3JhcCxcbiAgKTtcbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lXCJcbmltcG9ydCB7IGFubmVhbGluZ1dhc20gfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nX3dhc21cIlxuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgZGl2LCBoMiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCJcblxubGV0IHJlc3VsdDogQW5uZWFsaW5nUmVzdWx0XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRVcFdhc20ocGxhbm5lcjogTW9kdWxlKSB7XG4gIHJlc3VsdCA9IGF3YWl0IGFubmVhbGluZ1dhc20ocGxhbm5lcilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhc21WaWV3KF9wbGFubmVyOiBNb2R1bGUpIHtcbiAgaWYgKCFyZXN1bHQgKSB0aHJvdyBuZXcgRXJyb3IoXCJXQVNNIHBsYW5uZXIgaXMgbm90IHNldCB1cFwiKVxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHsgcGFkZGluZzogXCIxZW1cIiB9KSxcbiAgICBoMihcIldBU00gcGxhbm5lclwiKSxcbiAgICBwKFwiYXNzaWduZWQ6IFwiLCByZXN1bHQudW5hc3NpZ25lZC5sZW5ndGggLSByZXN1bHQudW5hc3NpZ25lZC5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSksXG4gICAgcChcInNjaGVkdWxlIHN0ZXBzOiBcIiwgcmVzdWx0LnNjaGVkdWxlU2l6ZXMucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCkpLFxuICAgIHAoXCJzZWFyY2ggdGltZTogXCIsIHJlc3VsdC5lbGFwc2VkTXMudG9GaXhlZCgyKSwgXCJtc1wiKSxcbiAgKVxufVxuXG4iLAogICAgIi8vIGJsYWtlMy50c1xuLy8gUHVyZSBUeXBlU2NyaXB0IEJMQUtFMy0yNTYgaW1wbGVtZW50YXRpb24uXG5cbmNvbnN0IE9VVF9MRU4gPSAzMjtcbmNvbnN0IEJMT0NLX0xFTiA9IDY0O1xuY29uc3QgQ0hVTktfTEVOID0gMTAyNDtcblxuY29uc3QgQ0hVTktfU1RBUlQgPSAxIDw8IDA7XG5jb25zdCBDSFVOS19FTkQgPSAxIDw8IDE7XG5jb25zdCBQQVJFTlQgPSAxIDw8IDI7XG5jb25zdCBST09UID0gMSA8PCAzO1xuXG5jb25zdCBJVjogcmVhZG9ubHkgbnVtYmVyW10gPSBbXG4gIDB4NmEwOWU2NjcsXG4gIDB4YmI2N2FlODUsXG4gIDB4M2M2ZWYzNzIsXG4gIDB4YTU0ZmY1M2EsXG4gIDB4NTEwZTUyN2YsXG4gIDB4OWIwNTY4OGMsXG4gIDB4MWY4M2Q5YWIsXG4gIDB4NWJlMGNkMTksXG5dO1xuXG5jb25zdCBNU0dfU0NIRURVTEU6IHJlYWRvbmx5IChyZWFkb25seSBudW1iZXJbXSlbXSA9IFtcbiAgWzAsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCAxMSwgMTIsIDEzLCAxNCwgMTVdLFxuICBbMiwgNiwgMywgMTAsIDcsIDAsIDQsIDEzLCAxLCAxMSwgMTIsIDUsIDksIDE0LCAxNSwgOF0sXG4gIFszLCA0LCAxMCwgMTIsIDEzLCAyLCA3LCAxNCwgNiwgNSwgOSwgMCwgMTEsIDE1LCA4LCAxXSxcbiAgWzEwLCA3LCAxMiwgOSwgMTQsIDMsIDEzLCAxNSwgNCwgMCwgMTEsIDIsIDUsIDgsIDEsIDZdLFxuICBbMTIsIDEzLCA5LCAxMSwgMTUsIDEwLCAxNCwgOCwgNywgMiwgNSwgMywgMCwgMSwgNiwgNF0sXG4gIFs5LCAxNCwgMTEsIDUsIDgsIDEyLCAxNSwgMSwgMTMsIDMsIDAsIDEwLCAyLCA2LCA0LCA3XSxcbiAgWzExLCAxNSwgNSwgMCwgMSwgOSwgOCwgNiwgMTQsIDEwLCAyLCAxMiwgMywgNCwgNywgMTNdLFxuXTtcblxuZnVuY3Rpb24gcm90cjMyKHg6IG51bWJlciwgbjogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuICgoeCA+Pj4gbikgfCAoeCA8PCAoMzIgLSBuKSkpID4+PiAwO1xufVxuXG5mdW5jdGlvbiBhZGQzMihhOiBudW1iZXIsIGI6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoYSArIGIpID4+PiAwO1xufVxuXG5mdW5jdGlvbiBsb2FkMzJMRShieXRlczogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKFxuICAgIGJ5dGVzW29mZnNldF0hIHxcbiAgICAoYnl0ZXNbb2Zmc2V0ICsgMV0hIDw8IDgpIHxcbiAgICAoYnl0ZXNbb2Zmc2V0ICsgMl0hIDw8IDE2KSB8XG4gICAgKGJ5dGVzW29mZnNldCArIDNdISA8PCAyNClcbiAgKSA+Pj4gMDtcbn1cblxuZnVuY3Rpb24gc3RvcmUzMkxFKG91dDogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIsIHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgb3V0W29mZnNldF0gPSB2YWx1ZSAmIDB4ZmY7XG4gIG91dFtvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOCkgJiAweGZmO1xuICBvdXRbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KSAmIDB4ZmY7XG4gIG91dFtvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpICYgMHhmZjtcbn1cblxuZnVuY3Rpb24gd29yZHNGcm9tQmxvY2soYmxvY2s6IFVpbnQ4QXJyYXkpOiBudW1iZXJbXSB7XG4gIGNvbnN0IHdvcmRzID0gbmV3IEFycmF5PG51bWJlcj4oMTYpLmZpbGwoMCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgY29uc3Qgb2Zmc2V0ID0gaSAqIDQ7XG4gICAgaWYgKG9mZnNldCArIDQgPD0gYmxvY2subGVuZ3RoKSB7XG4gICAgICB3b3Jkc1tpXSA9IGxvYWQzMkxFKGJsb2NrLCBvZmZzZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgdmFsdWUgPSAwO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCA0OyBqKyspIHtcbiAgICAgICAgY29uc3QgYnl0ZSA9IGJsb2NrW29mZnNldCArIGpdID8/IDA7XG4gICAgICAgIHZhbHVlIHw9IGJ5dGUgPDwgKDggKiBqKTtcbiAgICAgIH1cbiAgICAgIHdvcmRzW2ldID0gdmFsdWUgPj4+IDA7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHdvcmRzO1xufVxuXG5mdW5jdGlvbiBnKFxuICBzdGF0ZTogbnVtYmVyW10sXG4gIGE6IG51bWJlcixcbiAgYjogbnVtYmVyLFxuICBjOiBudW1iZXIsXG4gIGQ6IG51bWJlcixcbiAgbXg6IG51bWJlcixcbiAgbXk6IG51bWJlcixcbik6IHZvaWQge1xuICBzdGF0ZVthXSA9IGFkZDMyKGFkZDMyKHN0YXRlW2FdISwgc3RhdGVbYl0hKSwgbXgpO1xuICBzdGF0ZVtkXSA9IHJvdHIzMihzdGF0ZVtkXSEgXiBzdGF0ZVthXSEsIDE2KTtcbiAgc3RhdGVbY10gPSBhZGQzMihzdGF0ZVtjXSEsIHN0YXRlW2RdISk7XG4gIHN0YXRlW2JdID0gcm90cjMyKHN0YXRlW2JdISBeIHN0YXRlW2NdISwgMTIpO1xuXG4gIHN0YXRlW2FdID0gYWRkMzIoYWRkMzIoc3RhdGVbYV0hLCBzdGF0ZVtiXSEpLCBteSk7XG4gIHN0YXRlW2RdID0gcm90cjMyKHN0YXRlW2RdISBeIHN0YXRlW2FdISwgOCk7XG4gIHN0YXRlW2NdID0gYWRkMzIoc3RhdGVbY10hLCBzdGF0ZVtkXSEpO1xuICBzdGF0ZVtiXSA9IHJvdHIzMihzdGF0ZVtiXSEgXiBzdGF0ZVtjXSEsIDcpO1xufVxuXG5mdW5jdGlvbiByb3VuZChzdGF0ZTogbnVtYmVyW10sIG1zZzogcmVhZG9ubHkgbnVtYmVyW10sIHJvdW5kSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBzY2hlZHVsZSA9IE1TR19TQ0hFRFVMRVtyb3VuZEluZGV4XSE7XG5cbiAgZyhzdGF0ZSwgMCwgNCwgOCwgMTIsIG1zZ1tzY2hlZHVsZVswXSFdISwgbXNnW3NjaGVkdWxlWzFdIV0hKTtcbiAgZyhzdGF0ZSwgMSwgNSwgOSwgMTMsIG1zZ1tzY2hlZHVsZVsyXSFdISwgbXNnW3NjaGVkdWxlWzNdIV0hKTtcbiAgZyhzdGF0ZSwgMiwgNiwgMTAsIDE0LCBtc2dbc2NoZWR1bGVbNF0hXSEsIG1zZ1tzY2hlZHVsZVs1XSFdISk7XG4gIGcoc3RhdGUsIDMsIDcsIDExLCAxNSwgbXNnW3NjaGVkdWxlWzZdIV0hLCBtc2dbc2NoZWR1bGVbN10hXSEpO1xuXG4gIGcoc3RhdGUsIDAsIDUsIDEwLCAxNSwgbXNnW3NjaGVkdWxlWzhdIV0hLCBtc2dbc2NoZWR1bGVbOV0hXSEpO1xuICBnKHN0YXRlLCAxLCA2LCAxMSwgMTIsIG1zZ1tzY2hlZHVsZVsxMF0hXSEsIG1zZ1tzY2hlZHVsZVsxMV0hXSEpO1xuICBnKHN0YXRlLCAyLCA3LCA4LCAxMywgbXNnW3NjaGVkdWxlWzEyXSFdISwgbXNnW3NjaGVkdWxlWzEzXSFdISk7XG4gIGcoc3RhdGUsIDMsIDQsIDksIDE0LCBtc2dbc2NoZWR1bGVbMTRdIV0hLCBtc2dbc2NoZWR1bGVbMTVdIV0hKTtcbn1cblxuZnVuY3Rpb24gY29tcHJlc3MoXG4gIGN2OiByZWFkb25seSBudW1iZXJbXSxcbiAgYmxvY2tXb3JkczogcmVhZG9ubHkgbnVtYmVyW10sXG4gIGNvdW50ZXI6IG51bWJlcixcbiAgYmxvY2tMZW46IG51bWJlcixcbiAgZmxhZ3M6IG51bWJlcixcbik6IG51bWJlcltdIHtcbiAgY29uc3QgY291bnRlckxvdyA9IGNvdW50ZXIgPj4+IDA7XG4gIGNvbnN0IGNvdW50ZXJIaWdoID0gTWF0aC5mbG9vcihjb3VudGVyIC8gMHgxMDAwMDAwMDApID4+PiAwO1xuXG4gIGNvbnN0IHN0YXRlID0gW1xuICAgIGN2WzBdISxcbiAgICBjdlsxXSEsXG4gICAgY3ZbMl0hLFxuICAgIGN2WzNdISxcbiAgICBjdls0XSEsXG4gICAgY3ZbNV0hLFxuICAgIGN2WzZdISxcbiAgICBjdls3XSEsXG4gICAgSVZbMF0hLFxuICAgIElWWzFdISxcbiAgICBJVlsyXSEsXG4gICAgSVZbM10hLFxuICAgIGNvdW50ZXJMb3csXG4gICAgY291bnRlckhpZ2gsXG4gICAgYmxvY2tMZW4sXG4gICAgZmxhZ3MsXG4gIF07XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICByb3VuZChzdGF0ZSwgYmxvY2tXb3JkcywgaSk7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIHN0YXRlWzBdISBeIHN0YXRlWzhdISxcbiAgICBzdGF0ZVsxXSEgXiBzdGF0ZVs5XSEsXG4gICAgc3RhdGVbMl0hIF4gc3RhdGVbMTBdISxcbiAgICBzdGF0ZVszXSEgXiBzdGF0ZVsxMV0hLFxuICAgIHN0YXRlWzRdISBeIHN0YXRlWzEyXSEsXG4gICAgc3RhdGVbNV0hIF4gc3RhdGVbMTNdISxcbiAgICBzdGF0ZVs2XSEgXiBzdGF0ZVsxNF0hLFxuICAgIHN0YXRlWzddISBeIHN0YXRlWzE1XSEsXG4gICAgc3RhdGVbOF0hIF4gY3ZbMF0hLFxuICAgIHN0YXRlWzldISBeIGN2WzFdISxcbiAgICBzdGF0ZVsxMF0hIF4gY3ZbMl0hLFxuICAgIHN0YXRlWzExXSEgXiBjdlszXSEsXG4gICAgc3RhdGVbMTJdISBeIGN2WzRdISxcbiAgICBzdGF0ZVsxM10hIF4gY3ZbNV0hLFxuICAgIHN0YXRlWzE0XSEgXiBjdls2XSEsXG4gICAgc3RhdGVbMTVdISBeIGN2WzddISxcbiAgXS5tYXAoKHgpID0+IHggPj4+IDApO1xufVxuXG5jbGFzcyBPdXRwdXQge1xuICBjb25zdHJ1Y3RvcihcbiAgICByZWFkb25seSBpbnB1dENWOiByZWFkb25seSBudW1iZXJbXSxcbiAgICByZWFkb25seSBibG9ja1dvcmRzOiByZWFkb25seSBudW1iZXJbXSxcbiAgICByZWFkb25seSBjb3VudGVyOiBudW1iZXIsXG4gICAgcmVhZG9ubHkgYmxvY2tMZW46IG51bWJlcixcbiAgICByZWFkb25seSBmbGFnczogbnVtYmVyLFxuICApIHt9XG5cbiAgY2hhaW5pbmdWYWx1ZSgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIGNvbXByZXNzKFxuICAgICAgdGhpcy5pbnB1dENWLFxuICAgICAgdGhpcy5ibG9ja1dvcmRzLFxuICAgICAgdGhpcy5jb3VudGVyLFxuICAgICAgdGhpcy5ibG9ja0xlbixcbiAgICAgIHRoaXMuZmxhZ3MsXG4gICAgKS5zbGljZSgwLCA4KTtcbiAgfVxuXG4gIHJvb3RCeXRlcyhvdXRMZW4gPSBPVVRfTEVOKTogVWludDhBcnJheSB7XG4gICAgY29uc3Qgb3V0ID0gbmV3IFVpbnQ4QXJyYXkob3V0TGVuKTtcbiAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICBsZXQgb3V0cHV0QmxvY2tDb3VudGVyID0gMDtcblxuICAgIHdoaWxlIChvZmZzZXQgPCBvdXRMZW4pIHtcbiAgICAgIGNvbnN0IHdvcmRzID0gY29tcHJlc3MoXG4gICAgICAgIHRoaXMuaW5wdXRDVixcbiAgICAgICAgdGhpcy5ibG9ja1dvcmRzLFxuICAgICAgICBvdXRwdXRCbG9ja0NvdW50ZXIsXG4gICAgICAgIHRoaXMuYmxvY2tMZW4sXG4gICAgICAgIHRoaXMuZmxhZ3MgfCBST09ULFxuICAgICAgKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNiAmJiBvZmZzZXQgPCBvdXRMZW47IGkrKykge1xuICAgICAgICBjb25zdCB3b3JkQnl0ZXMgPSBuZXcgVWludDhBcnJheSg0KTtcbiAgICAgICAgc3RvcmUzMkxFKHdvcmRCeXRlcywgMCwgd29yZHNbaV0hKTtcblxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDQgJiYgb2Zmc2V0IDwgb3V0TGVuOyBqKyspIHtcbiAgICAgICAgICBvdXRbb2Zmc2V0XSA9IHdvcmRCeXRlc1tqXSE7XG4gICAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgb3V0cHV0QmxvY2tDb3VudGVyKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBjaHVua091dHB1dChcbiAgY2h1bms6IFVpbnQ4QXJyYXksXG4gIGtleTogcmVhZG9ubHkgbnVtYmVyW10sXG4gIGNodW5rQ291bnRlcjogbnVtYmVyLFxuICBmbGFnczogbnVtYmVyLFxuKTogT3V0cHV0IHtcbiAgbGV0IGN2ID0gWy4uLmtleV07XG5cbiAgY29uc3QgYmxvY2tDb3VudCA9IE1hdGgubWF4KDEsIE1hdGguY2VpbChjaHVuay5sZW5ndGggLyBCTE9DS19MRU4pKTtcblxuICBmb3IgKGxldCBibG9ja0luZGV4ID0gMDsgYmxvY2tJbmRleCA8IGJsb2NrQ291bnQ7IGJsb2NrSW5kZXgrKykge1xuICAgIGNvbnN0IGJsb2NrU3RhcnQgPSBibG9ja0luZGV4ICogQkxPQ0tfTEVOO1xuICAgIGNvbnN0IGJsb2NrID0gY2h1bmsuc3ViYXJyYXkoYmxvY2tTdGFydCwgYmxvY2tTdGFydCArIEJMT0NLX0xFTik7XG4gICAgY29uc3QgYmxvY2tXb3JkcyA9IHdvcmRzRnJvbUJsb2NrKGJsb2NrKTtcblxuICAgIGNvbnN0IGlzRmlyc3RCbG9jayA9IGJsb2NrSW5kZXggPT09IDA7XG4gICAgY29uc3QgaXNMYXN0QmxvY2sgPSBibG9ja0luZGV4ID09PSBibG9ja0NvdW50IC0gMTtcblxuICAgIGNvbnN0IGJsb2NrRmxhZ3MgPVxuICAgICAgZmxhZ3MgfFxuICAgICAgKGlzRmlyc3RCbG9jayA/IENIVU5LX1NUQVJUIDogMCkgfFxuICAgICAgKGlzTGFzdEJsb2NrID8gQ0hVTktfRU5EIDogMCk7XG5cbiAgICBpZiAoaXNMYXN0QmxvY2spIHtcbiAgICAgIHJldHVybiBuZXcgT3V0cHV0KGN2LCBibG9ja1dvcmRzLCBjaHVua0NvdW50ZXIsIGJsb2NrLmxlbmd0aCwgYmxvY2tGbGFncyk7XG4gICAgfVxuXG4gICAgY3YgPSBjb21wcmVzcyhjdiwgYmxvY2tXb3JkcywgY2h1bmtDb3VudGVyLCBCTE9DS19MRU4sIGJsb2NrRmxhZ3MpLnNsaWNlKDAsIDgpO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKFwidW5yZWFjaGFibGVcIik7XG59XG5cbmZ1bmN0aW9uIHBhcmVudE91dHB1dChcbiAgbGVmdENWOiByZWFkb25seSBudW1iZXJbXSxcbiAgcmlnaHRDVjogcmVhZG9ubHkgbnVtYmVyW10sXG4gIGtleTogcmVhZG9ubHkgbnVtYmVyW10sXG4gIGZsYWdzOiBudW1iZXIsXG4pOiBPdXRwdXQge1xuICBjb25zdCBibG9ja1dvcmRzID0gWy4uLmxlZnRDViwgLi4ucmlnaHRDVl07XG4gIHJldHVybiBuZXcgT3V0cHV0KGtleSwgYmxvY2tXb3JkcywgMCwgQkxPQ0tfTEVOLCBmbGFncyB8IFBBUkVOVCk7XG59XG5cbmZ1bmN0aW9uIHBhcmVudENWKFxuICBsZWZ0Q1Y6IHJlYWRvbmx5IG51bWJlcltdLFxuICByaWdodENWOiByZWFkb25seSBudW1iZXJbXSxcbiAga2V5OiByZWFkb25seSBudW1iZXJbXSxcbiAgZmxhZ3M6IG51bWJlcixcbik6IG51bWJlcltdIHtcbiAgcmV0dXJuIHBhcmVudE91dHB1dChsZWZ0Q1YsIHJpZ2h0Q1YsIGtleSwgZmxhZ3MpLmNoYWluaW5nVmFsdWUoKTtcbn1cblxuZnVuY3Rpb24gbGFyZ2VzdFBvd2VyT2ZUd29MZXNzVGhhbihuOiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgcG93ZXIgPSAxO1xuICB3aGlsZSAocG93ZXIgKiAyIDwgbikge1xuICAgIHBvd2VyICo9IDI7XG4gIH1cbiAgcmV0dXJuIHBvd2VyO1xufVxuXG5mdW5jdGlvbiBsZWZ0TGVuKGlucHV0TGVuOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBmdWxsQ2h1bmtzID0gTWF0aC5mbG9vcigoaW5wdXRMZW4gLSAxKSAvIENIVU5LX0xFTik7XG4gIHJldHVybiBsYXJnZXN0UG93ZXJPZlR3b0xlc3NUaGFuKGZ1bGxDaHVua3MgKyAxKSAqIENIVU5LX0xFTjtcbn1cblxuZnVuY3Rpb24gc3VidHJlZU91dHB1dChcbiAgaW5wdXQ6IFVpbnQ4QXJyYXksXG4gIGtleTogcmVhZG9ubHkgbnVtYmVyW10sXG4gIGNodW5rQ291bnRlcjogbnVtYmVyLFxuICBmbGFnczogbnVtYmVyLFxuKTogT3V0cHV0IHtcbiAgaWYgKGlucHV0Lmxlbmd0aCA8PSBDSFVOS19MRU4pIHtcbiAgICByZXR1cm4gY2h1bmtPdXRwdXQoaW5wdXQsIGtleSwgY2h1bmtDb3VudGVyLCBmbGFncyk7XG4gIH1cblxuICBjb25zdCBsZWZ0TGVuZ3RoID0gbGVmdExlbihpbnB1dC5sZW5ndGgpO1xuXG4gIGNvbnN0IGxlZnQgPSBpbnB1dC5zdWJhcnJheSgwLCBsZWZ0TGVuZ3RoKTtcbiAgY29uc3QgcmlnaHQgPSBpbnB1dC5zdWJhcnJheShsZWZ0TGVuZ3RoKTtcblxuICBjb25zdCBsZWZ0Q1YgPSBzdWJ0cmVlT3V0cHV0KGxlZnQsIGtleSwgY2h1bmtDb3VudGVyLCBmbGFncykuY2hhaW5pbmdWYWx1ZSgpO1xuICBjb25zdCByaWdodENWID0gc3VidHJlZU91dHB1dChcbiAgICByaWdodCxcbiAgICBrZXksXG4gICAgY2h1bmtDb3VudGVyICsgbGVmdExlbmd0aCAvIENIVU5LX0xFTixcbiAgICBmbGFncyxcbiAgKS5jaGFpbmluZ1ZhbHVlKCk7XG5cbiAgcmV0dXJuIHBhcmVudE91dHB1dChsZWZ0Q1YsIHJpZ2h0Q1YsIGtleSwgZmxhZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmxha2UzKGlucHV0OiBVaW50OEFycmF5IHwgc3RyaW5nKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGJ5dGVzID1cbiAgICB0eXBlb2YgaW5wdXQgPT09IFwic3RyaW5nXCIgPyBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoaW5wdXQpIDogaW5wdXQ7XG5cbiAgcmV0dXJuIHN1YnRyZWVPdXRwdXQoYnl0ZXMsIElWLCAwLCAwKS5yb290Qnl0ZXMoT1VUX0xFTik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBibGFrZTNIZXgoaW5wdXQ6IFVpbnQ4QXJyYXkgfCBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gWy4uLmJsYWtlMyhpbnB1dCldXG4gICAgLm1hcCgoYnl0ZSkgPT4gYnl0ZS50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpKVxuICAgIC5qb2luKFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzaCAoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBibGFrZTNIZXgoaW5wdXQpLnNsaWNlKDAsIDE2KTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgaGFzaCB9IGZyb20gXCIuL2hhc2hcIjtcbmltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRJbnQsIHJhbmRvbSwgc2V0UmFuZFNlZWQgfSBmcm9tIFwiLi9yYW5kb21cIjtcbmltcG9ydCB7IHJhbmRvbVVVSUQsIHR5cGUgTW9kdWxlLCB0eXBlIFJlcXVlc3QgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgUkVBTF9ST0FETUFQX1ZFUlNJT04gPSAxO1xuXG5leHBvcnQgdHlwZSBEZWFsZXJTaXRlID0ge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGxvbjogbnVtYmVyO1xuICBsYXQ6IG51bWJlcjtcbiAgc291cmNlOiBcIm9wZW5zdHJlZXRtYXBcIjtcbn07XG5cbmV4cG9ydCB0eXBlIFJlYWxSb2FkTWFwQ2FjaGUgPSB7XG4gIHZlcnNpb246IHR5cGVvZiBSRUFMX1JPQURNQVBfVkVSU0lPTjtcbiAgZ2VuZXJhdGVkQXQ6IHN0cmluZztcbiAgcm91dGluZ1Byb2ZpbGU6IFwiZHJpdmluZy1oZ3ZcIjtcbiAgcm91dGluZ1NvdXJjZT86IFwib3BlbnJvdXRlc2VydmljZVwiIHwgXCJhcHByb3hpbWF0ZVwiO1xuICBzb3VyY2VIYXNoOiBzdHJpbmc7XG4gIHNpdGVzOiBEZWFsZXJTaXRlW107XG4gIC8qKiBTeW1tZXRyaWMsIHBhY2tlZCwgaW50ZWdlciBraWxvbWV0cmVzOyBjb21wYXRpYmxlIHdpdGggdGhlIGV4aXN0aW5nIFdBU00gc29sdmVyLiAqL1xuICBkaXN0YW5jZXNLbTogbnVtYmVyW107XG4gIC8qKiBTeW1tZXRyaWMsIHBhY2tlZCB0cmF2ZWwgbWludXRlcy4gS2VwdCBmb3IgcmVhbGlzdGljIGRlYWRsaW5lcyBhbmQgZnV0dXJlIHNjb3JpbmcuICovXG4gIGR1cmF0aW9uc01pbnV0ZXM6IG51bWJlcltdO1xufTtcblxuZXhwb3J0IHR5cGUgUmVhbFBvcyA9IHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG4gIGxvbjogbnVtYmVyO1xuICBsYXQ6IG51bWJlcjtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhY2tlZFJvYWRJbmRleChwb2ludENvdW50OiBudW1iZXIsIGZyb206IG51bWJlciwgdG86IG51bWJlcik6IG51bWJlciB7XG4gIGlmIChmcm9tID09PSB0bykgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCBhIHJvYWQgZnJvbSBhIHBvaW50IHRvIGl0c2VsZlwiKTtcbiAgbGV0IGEgPSBmcm9tO1xuICBsZXQgYiA9IHRvO1xuICBpZiAoYSA8IGIpIFthLCBiXSA9IFtiLCBhXTtcbiAgbGV0IGluZGV4ID0gYSArIHBvaW50Q291bnQgKiBiO1xuICBjb25zdCBwYWNrZWRTaXplID0gcG9pbnRDb3VudCAqIHBvaW50Q291bnQgLyAyO1xuICBpZiAoaW5kZXggPiBwYWNrZWRTaXplKSBpbmRleCA9IHBvaW50Q291bnQgKiogMiAtIGluZGV4O1xuICByZXR1cm4gaW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFsUm9hZE1hcEZyb21DYWNoZShjYWNoZTogUmVhbFJvYWRNYXBDYWNoZSkge1xuICBpZiAoY2FjaGUudmVyc2lvbiAhPT0gUkVBTF9ST0FETUFQX1ZFUlNJT04pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHJlYWwtcm9hZG1hcCBjYWNoZSB2ZXJzaW9uICR7Y2FjaGUudmVyc2lvbn1gKTtcbiAgfVxuXG4gIGNvbnN0IHBvaW50Q291bnQgPSBjYWNoZS5zaXRlcy5sZW5ndGg7XG4gIGlmIChwb2ludENvdW50ICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBleGlzdGluZyBwYWNrZWQgV0FTTSBtYXRyaXggbGF5b3V0IHJlcXVpcmVzIGFuIGV2ZW4gbnVtYmVyIG9mIHNpdGVzXCIpO1xuICB9XG4gIGNvbnN0IG1hdHJpeFNpemUgPSBwb2ludENvdW50ICogcG9pbnRDb3VudCAvIDI7XG4gIGlmIChjYWNoZS5kaXN0YW5jZXNLbS5sZW5ndGggIT09IG1hdHJpeFNpemUgfHwgY2FjaGUuZHVyYXRpb25zTWludXRlcy5sZW5ndGggIT09IG1hdHJpeFNpemUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcmVhbC1yb2FkbWFwIG1hdHJpeCBzaXplIGZvciAke3BvaW50Q291bnR9IHNpdGVzYCk7XG4gIH1cblxuICBjb25zdCBDb3N0TWF0cml4ID0gVWludDMyQXJyYXkuZnJvbShjYWNoZS5kaXN0YW5jZXNLbSk7XG4gIGNvbnN0IER1cmF0aW9uTWF0cml4ID0gVWludDMyQXJyYXkuZnJvbShjYWNoZS5kdXJhdGlvbnNNaW51dGVzKTtcbiAgY29uc3QgcG9pbnRzOiBSZWFsUG9zW10gPSBjYWNoZS5zaXRlcy5tYXAoc2l0ZSA9PiAoe1xuICAgIHg6IHNpdGUubG9uLFxuICAgIHk6IHNpdGUubGF0LFxuICAgIGxvbjogc2l0ZS5sb24sXG4gICAgbGF0OiBzaXRlLmxhdCxcbiAgICBpZDogc2l0ZS5pZCxcbiAgICBuYW1lOiBzaXRlLm5hbWUsXG4gIH0pKTtcbiAgY29uc3QgcmFuZ2UgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBwb2ludENvdW50IH0sIChfLCBpbmRleCkgPT4gaW5kZXgpO1xuICBjb25zdCByb2FkSURYID0gKGZyb206IG51bWJlciwgdG86IG51bWJlcikgPT4gcGFja2VkUm9hZEluZGV4KHBvaW50Q291bnQsIGZyb20sIHRvKTtcbiAgY29uc3QgZ2V0cm9hZCA9IChmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIpID0+IENvc3RNYXRyaXhbcm9hZElEWChmcm9tLCB0byldITtcbiAgY29uc3QgZmluZFBhdGggPSAoZnJvbTogbnVtYmVyLCB0bzogbnVtYmVyKSA9PiBmcm9tID09PSB0byA/IFtmcm9tXSA6IFtmcm9tLCB0b107XG4gIGNvbnN0IGdldENvc3ROID0gKC4uLnN0b3BzOiBudW1iZXJbXSkgPT4gc3VtTGVncyhDb3N0TWF0cml4LCByb2FkSURYLCBzdG9wcyk7XG4gIGNvbnN0IGdldER1cmF0aW9uTWludXRlc04gPSAoLi4uc3RvcHM6IG51bWJlcltdKSA9PiBzdW1MZWdzKER1cmF0aW9uTWF0cml4LCByb2FkSURYLCBzdG9wcyk7XG5cbiAgcmV0dXJuIHtcbiAgICBwb2ludHMsXG4gICAgcmFuZ2UsXG4gICAgQ29zdE1hdHJpeCxcbiAgICBEdXJhdGlvbk1hdHJpeCxcbiAgICByb2FkSURYLFxuICAgIGdldHJvYWQsXG4gICAgZmluZFBhdGgsXG4gICAgZ2V0Q29zdE4sXG4gICAgZ2V0RHVyYXRpb25NaW51dGVzTixcbiAgICBjYWNoZSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gc3VtTGVncyhtYXRyaXg6IFVpbnQzMkFycmF5LCBpbmRleDogKGE6IG51bWJlciwgYjogbnVtYmVyKSA9PiBudW1iZXIsIHN0b3BzOiBudW1iZXJbXSkge1xuICBsZXQgdG90YWwgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSArIDEgPCBzdG9wcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzdG9wc1tpXSAhPT0gc3RvcHNbaSArIDFdKSB0b3RhbCArPSBtYXRyaXhbaW5kZXgoc3RvcHNbaV0hLCBzdG9wc1tpICsgMV0hKV0hO1xuICB9XG4gIHJldHVybiB0b3RhbDtcbn1cblxuLyoqIENyZWF0ZXMgbm9ybWFsIHBsYW5uZXIgaW5wdXQgZnJvbSBhIGNhY2hlZCByZWFsIG1hcCB3aXRob3V0IGNoYW5naW5nIHRoZSBzeW50aGV0aWMgZ2VuZXJhdG9yLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWxNb2R1bGUoXG4gIHJvYWRtYXA6IFJldHVyblR5cGU8dHlwZW9mIHJlYWxSb2FkTWFwRnJvbUNhY2hlPixcbiAgTlJFUVMgPSAyMDAsXG4gIE5UUkFOUyA9IDQwLFxuICBzZWVkID0gMjIsXG4pOiBNb2R1bGUge1xuICBpZiAocm9hZG1hcC5wb2ludHMubGVuZ3RoIDwgMikgdGhyb3cgbmV3IEVycm9yKFwiQSByZWFsIHJvYWRtYXAgbmVlZHMgYXQgbGVhc3QgdHdvIGRlYWxlciBzaXRlc1wiKTtcbiAgc2V0UmFuZFNlZWQoc2VlZCk7XG5cbiAgY29uc3QgZGlmZmVyZW50UG9pbnQgPSAoZnJvbTogbnVtYmVyKSA9PiB7XG4gICAgbGV0IHRvID0gcmFuZENob2ljZShyb2FkbWFwLnJhbmdlKTtcbiAgICB3aGlsZSAodG8gPT09IGZyb20pIHRvID0gcmFuZENob2ljZShyb2FkbWFwLnJhbmdlKTtcbiAgICByZXR1cm4gdG87XG4gIH07XG5cbiAgY29uc3QgcmVxdWVzdHMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBOUkVRUyB9LCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhcnRQb2ludCA9IHJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSk7XG4gICAgY29uc3QgZW5kUG9pbnQgPSBkaWZmZXJlbnRQb2ludChzdGFydFBvaW50KTtcbiAgICBjb25zdCBkaXJlY3RNaW51dGVzID0gcm9hZG1hcC5nZXREdXJhdGlvbk1pbnV0ZXNOKHN0YXJ0UG9pbnQsIGVuZFBvaW50KTtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHJhbmRvbVVVSUQoKSxcbiAgICAgIHN0YXJ0UG9pbnQsXG4gICAgICBlbmRQb2ludCxcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxNTAsIDYwMCksXG4gICAgICBkZWFkbGluZV9oOiAoZGlyZWN0TWludXRlcyArIDQgKiA2MCArIHJhbmRvbSgpICogMzYgKiA2MCkgLyA2MCxcbiAgICB9IHNhdGlzZmllcyBSZXF1ZXN0O1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIE5UUkFOUyxcbiAgICBOUkVRUyxcbiAgICBNQVBTSVpFOiAxLFxuICAgIFJTSVpFOiByb2FkbWFwLkNvc3RNYXRyaXgubGVuZ3RoLFxuICAgIHJvYWRtYXAsXG4gICAgcmVxdWVzdHMsXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oeyBsZW5ndGg6IE5UUkFOUyB9LCAoKSA9PiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWxSb2FkTWFwU291cmNlSGFzaChzaXRlczogRGVhbGVyU2l0ZVtdLCByb3V0aW5nUHJvZmlsZSA9IFwiZHJpdmluZy1oZ3ZcIikge1xuICByZXR1cm4gaGFzaChKU09OLnN0cmluZ2lmeSh7IHZlcnNpb246IFJFQUxfUk9BRE1BUF9WRVJTSU9OLCByb3V0aW5nUHJvZmlsZSwgc2l0ZXMgfSkpO1xufVxuIiwKICAgICJpbXBvcnQgeyBoYXNoIH0gZnJvbSBcIi4uL2hhc2hcIjtcbmltcG9ydCB7IGJvZHksIGJ1dHRvbiwgY29sb3IsIGRpdiwgZXJyb3Jwb3B1cCwgaDEsIGgyLCBoMywgaW5wdXQsIG1hcmdpbiwgcCwgcGFkZGluZywgcG9wdXAsIHByZSwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB3aWR0aCwgdGV4dGFyZWEsIGEsIGJvcmRlciwgaHRtbCwgdGgsIHRyLCB0ZCwgYm9yZGVyUmFkaXVzLCBwYW5lbExpc3QsIGRpc3BsYXksIGJhY2tncm91bmQgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBtYXBWaWV3IH0gZnJvbSBcIi4vbWFwVmlld1wiO1xuaW1wb3J0IHsgcmFuZG9tTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IHJhbmRvbU1vZHVsZSwgcmFuZG9tVVVJRCwgUmVxdWVzdCwgU2NoZWR1bGUsIFVVSUQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IG1rU3RvcmVkLCBta1dyaXRhYmxlLCB0eXBlIFdyaXRhYmxlIH0gZnJvbSBcIi4uL3dyaXRlYWJsZVwiO1xuaW1wb3J0IHsgc2V0UmFuZFNlZWQgfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgeyBudW1iZXIgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5pbXBvcnQgeyBwbGFubmVyVmlldyB9IGZyb20gXCIuLi9wbGFubmVycy92aWV3UGxhblwiO1xuaW1wb3J0IHsgc2V0VXBXYXNtLCB3YXNtVmlldyB9IGZyb20gXCIuL3dhc212aWV3XCI7XG5pbXBvcnQgeyByZWFsTW9kdWxlLCByZWFsUm9hZE1hcEZyb21DYWNoZSwgdHlwZSBSZWFsUm9hZE1hcENhY2hlIH0gZnJvbSBcIi4uL3JlYWxfcm9hZG1hcFwiO1xuXG5cbi8vIFZlcnNpb25lZCBrZXlzIGludGVudGlvbmFsbHkgcmVzZXQgdGhlIGVhcmxpZXIgc21hbGwgVUkgZGVtbyBkZWZhdWx0cyAoNS8yMCkuXG5leHBvcnQgbGV0IExLV19DT1VOVCA9IG1rU3RvcmVkKFwiTEtXX0NPVU5UX1YyXCIsIG51bWJlciwgNDApXG5sZXQgUkVRVUVTVF9DT1VOVCA9IG1rU3RvcmVkKFwiUkVRVUVTVF9DT1VOVF9WMlwiLCBudW1iZXIsIDIwMClcblxuYm9keS5zdHlsZS5tYXJnaW4gPSBcIjBcIlxuXG5sZXQgaGVhZGVyID0gaDEoXCJyb3V0ZSBwbGFubmVyXCIsIHN0eWxlKHtiYWNrZ3JvdW5kOiBjb2xvci5ibHVlLCBjb2xvcjogY29sb3IuYmFja2dyb3VuZCwgbWFyZ2luOiBcIjBcIiwgcGFkZGluZzogXCIuNmVtXCJ9KSlcblxubGV0IGNvbnRlbnRTcGFjZSA9IGRpdihzdHlsZSh7XG4gIGRpc3BsYXk6XCJmbGV4XCIsXG4gIGZsZXhEaXJlY3Rpb246XCJyb3dcIixcbiAgd2lkdGg6IFwiMTAwJVwiLFxuICBoZWlnaHQ6IFwiY2FsYygxMDAlIC0gMi41ZW0pXCIsXG4gIG1pbldpZHRoOiBcIjBcIixcbn0pKVxuXG5sZXQgcGFnZSA9IGRpdihcbiAgc3R5bGUoe2Rpc3BsYXk6XCJmbGV4XCIsIGZsZXhEaXJlY3Rpb246XCJjb2x1bW5cIiwgaGVpZ2h0OiBcIjEwMCVcIn0pLFxuICBoZWFkZXIsXG4gIGNvbnRlbnRTcGFjZVxuKVxuXG5ib2R5LnJlcGxhY2VDaGlsZHJlbihwYWdlKVxuXG5zZXRSYW5kU2VlZCgyNClcblxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbE1vZHVsZSgpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiLi9yZWFsLXJvYWRtYXAuanNvblwiKVxuICAgIGlmICghcmVzcG9uc2Uub2spIHRocm93IG5ldyBFcnJvcihhd2FpdCByZXNwb25zZS50ZXh0KCkpXG4gICAgY29uc3QgY2FjaGUgPSBhd2FpdCByZXNwb25zZS5qc29uKCkgYXMgUmVhbFJvYWRNYXBDYWNoZVxuICAgIGNvbnN0IHJvYWRtYXAgPSByZWFsUm9hZE1hcEZyb21DYWNoZShjYWNoZSlcbiAgICBjb25zb2xlLmluZm8oYFVzaW5nIGNhY2hlZCByZWFsIHJvYWRtYXAgd2l0aCAke3JvYWRtYXAucG9pbnRzLmxlbmd0aH0gY2FyIGRlYWxlcnNgKVxuICAgIHJldHVybiByZWFsTW9kdWxlKHJvYWRtYXAsIFJFUVVFU1RfQ09VTlQuZ2V0KCksIExLV19DT1VOVC5nZXQoKSwgMjQpXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5pbmZvKFwiVXNpbmcgc3ludGhldGljIHJvYWRtYXA7IGJ1aWxkIHRoZSByZWFsLXJvYWRtYXAgY2FjaGUgdG8gZW5hYmxlIEdlcm1hbnkgZGF0YVwiLCBlcnJvcilcbiAgICByZXR1cm4gcmFuZG9tTW9kdWxlKFJFUVVFU1RfQ09VTlQuZ2V0KCksIExLV19DT1VOVC5nZXQoKSlcbiAgfVxufVxuXG5leHBvcnQgbGV0IG1vZHVsZSA9IGF3YWl0IGluaXRpYWxNb2R1bGUoKVxuXG5leHBvcnQgdHlwZSBIaWdoTGlnaHQgPSB7XG4gIHBvaW50czoge1xuICAgIG51bWJlcjogbnVtYmVyLFxuICAgIGxvZ28/IDogc3RyaW5nLFxuICB9W10sXG4gIGNvbG9yPzogc3RyaW5nXG59XG5cbmV4cG9ydCBsZXQgaGlnaHRMaWdodHMgPSBta1dyaXRhYmxlIDxIaWdoTGlnaHRbXT4oIFtdIClcblxuXG5mdW5jdGlvbiBzZXR0ZXIgKHN0b3JlOiBXcml0YWJsZTxudW1iZXI+ICl7XG4gIGxldCBpbnAgPSBpbnB1dCgpXG4gIGlucC50eXBlID0gXCJudW1iZXJcIlxuICBpbnAub25jaGFuZ2UgPSAoKT0+e1xuICAgIGxldCB2YWwgPSBwYXJzZUludChpbnAudmFsdWUpXG4gICAgaWYgKGlzTmFOKHZhbCkpIHJldHVyblxuICAgIHN0b3JlLnNldCh2YWwpXG4gIH1cbiAgc3RvcmUub251cGRhdGUodmFsPT5pbnAudmFsdWUgPSB2YWwudG9TdHJpbmcoKSlcblxuICByZXR1cm4gaW5wXG59XG5cblxuYXdhaXQgc2V0VXBXYXNtKG1vZHVsZSlcblxuYXN5bmMgZnVuY3Rpb24gbWtXaW5kb3cgKHRhYjogbnVtYmVyID0gMCApIHtcblxuICBsZXQgdGFiRmllbGRzID0gW1xuICAgIFsnbWFwJywgbWFwVmlldyhtb2R1bGUpXSxcbiAgICBbJ3BsYW5uZXInLCBhd2FpdCBwbGFubmVyVmlldyhtb2R1bGUpXSxcbiAgICBbJ3dhc20nLCB3YXNtVmlldyhtb2R1bGUpXVxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gIH0pKVxuXG4gIGZ1bmN0aW9uIG9wZW5UYWIodGFiOiB0eXBlb2YgdGFiRmllbGRzW251bWJlcl1bMF0pIHtcbiAgICBjb25zdCB0YWJzID0gcChcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgbWFyZ2luOiBcIjBcIixcbiAgICAgICAgcGFkZGluZzogXCIuNGVtXCIsXG4gICAgICAgIGZsZXg6IFwiMCAwIGF1dG9cIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLm1hcCgoW24sZV0pPT5cbiAgICAgICAgc3BhbiggbixcbiAgICAgICAgICAoKT0+b3BlblRhYihuKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIi4zZW1cIixcbiAgICAgICAgICAgIG1hcmdpbjogXCIuM2VtXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIisgKG49PXRhYiA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSksXG4gICAgICAgICAgICBjb2xvcjogKG49PXRhYikgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBkaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGZsZXg6IFwiMSAxIGF1dG9cIixcbiAgICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICAgICAgbWluV2lkdGg6IFwiMFwiLFxuICAgICAgfSksXG4gICAgICB0YWJGaWVsZHMuZmluZCgoW24sXSk9Pm49PXRhYikhWzFdXG4gICAgKVxuXG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgdGFicyxcbiAgICAgIGNvbnRlbnRcbiAgICApXG4gIH1cblxuICBvcGVuVGFiKHRhYkZpZWxkc1t0YWJdIVswXSlcblxuICByZXR1cm4gZWxcbn1cblxuY29udGVudFNwYWNlLnJlcGxhY2VDaGlsZHJlbiguLi5hd2FpdCBQcm9taXNlLmFsbChbbWtXaW5kb3coMSksIG1rV2luZG93KCldKSlcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFFTyxJQUFNLE9BQU8sU0FBUztBQUU3QixJQUFNLGVBQWU7QUFBQSxFQUNuQixPQUFNO0FBQUEsSUFDSixPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsRUFDckI7QUFBQSxFQUNBLE1BQUs7QUFBQSxJQUNILE9BQW1CO0FBQUEsSUFDbkIsWUFBbUI7QUFBQSxJQUNuQixLQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxFQUNyQjtBQUNGO0FBRU8sSUFBTSxRQUFRO0FBQUEsRUFDbkIsT0FBTztBQUFBLEVBQ1AsWUFBWTtBQUFBLEVBQ1osTUFBTTtBQUFBLEVBQ04sV0FBVztBQUFBLEVBQ1gsS0FBSztBQUFBLEVBQ0wsT0FBTztBQUFBLEVBQ1AsTUFBTTtBQUFBLEVBQ04sV0FBVztBQUNiO0FBR0EsSUFBSSxPQUFPLFNBQVMsY0FBYyxPQUFPO0FBQ3pDLEtBQUssWUFBWTtBQUFBO0FBQUEsYUFFSixhQUFhLEtBQUs7QUFBQSxrQkFDYixhQUFhLEtBQUs7QUFBQSxXQUN6QixhQUFhLEtBQUs7QUFBQSxhQUNoQixhQUFhLEtBQUs7QUFBQSxZQUNuQixhQUFhLEtBQUs7QUFBQSxZQUNsQixhQUFhLEtBQUs7QUFBQSxpQkFDYixhQUFhLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQU9wQixhQUFhLE1BQU07QUFBQSxvQkFDZCxhQUFhLE1BQU07QUFBQSxhQUMxQixhQUFhLE1BQU07QUFBQSxlQUNqQixhQUFhLE1BQU07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
