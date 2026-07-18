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
var readStruct = (type, packed) => withoutRecording(() => Object.assign(Object.fromEntries(Object.keys(type.fields).map((name) => [name, readField(packed, type.layout[name])])), { packed }));
var structValue = (type, packed) => {
  const fields = withoutRecording(() => Object.fromEntries(Object.keys(type.fields).map((name) => [name, packedFieldValue(packed, type.layout[name])])));
  return Object.assign(fields, { packed, set: (value) => packed.set("packed" in value ? value.packed : packStruct(type, value)) });
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
  if ("set" in fields || "packed" in fields)
    throw new Error("Struct fields cannot be named set or packed");
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
  steps: 1600000,
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
      const step = variable(STOP, schedule.at(offset.add(i)));
      const req = variable(step.req_id);
      const request = variable(REQ, requests.at(req));
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
    const selected = variable(STOP, schedView.at(randint.call(tsize)));
    const req = variable(selected.req_id);
    const deck = variable(selected.deck);
    for_(0, tsize, (i) => {
      const step = variable(STOP, schedView.at(i));
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
    const selected = variable(STOP, srcView.at(randint.call(srcSize)));
    const req = variable(selected.req_id);
    const deck = variable(selected.deck);
    for_(0, srcSize, (i) => {
      const step = variable(STOP, srcView.at(i));
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
    const selected = variable(STOP, schedule.at(offset.add(from)));
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
      const crossed = variable(STOP, schedule.at(offset.add(i)));
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
  const innerBorder = "1px solid " + color.lightgray;
  const cellPadding = ".35em .5em";
  const scheduleCellMinHeight = "2.1em";
  let annealer = null;
  let annealingSession = null;
  let annealingTimer = null;
  let runId = 0;
  function itemButton(item, load) {
    const req = mod.requests[item];
    const sp = span(item.toString().padStart(3, " "), style({
      cursor: "pointer",
      border: "2px solid transparent",
      borderRadius: ".2em",
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
    sp.onmouseenter = () => {
      sp.style.borderColor = color.green;
      hightLights.set([{ points }]);
    };
    sp.onmouseleave = () => {
      sp.style.borderColor = "transparent";
    };
    return sp;
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
      width: "100%"
    }), tr(th("transporter", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("value", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("steps", style({ border: outerBorder, padding: cellPadding, textAlign: "left" }))), mod.startpositions.map((start, tran) => tr(td(tran, style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), function() {
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
    }), td(euros(annealer?.scheduleRatings[tran] ?? 0), style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" })), td(table(style({
      borderCollapse: "collapse"
    }), [0, 1].map((deck) => tr(Array.from({ length: annealer.scheduleSizes[tran] }, (_, i) => {
      const step = annealer?.schedule[tran * annealer.TSIZE + i];
      const load = isLoad(step);
      return td(getDeck(step) === deck ? itemButton(getReq(step), !!load) : "", style({
        color: load ? color.blue : color.green,
        border: innerBorder,
        padding: ".2em .3em",
        minWidth: "2.6em",
        height: scheduleCellMinHeight,
        boxSizing: "border-box"
      }));
    })))), style({
      border: outerBorder,
      padding: ".25em",
      verticalAlign: "top"
    })))));
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

//# debugId=9659BFBAE9E81A5664756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3dhc20vYXN0LnRzIiwgInNyYy93YXNtL2FuYWx5emUudHMiLCAic3JjL3dhc20vY29kZWdlbi50cyIsICJzcmMvd2FzbS9pbmRleC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3dhc20udHMiLCAic3JjL3BsYW5uZXJzL3ZpZXdQbGFuLnRzIiwgInNyYy92aWV3L3dhc212aWV3LnRzIiwgInNyYy9oYXNoLnRzIiwgInNyYy9yZWFsX3JvYWRtYXAudHMiLCAic3JjL3ZpZXcvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsKICAgICJcbmltcG9ydCB0eXBlIHsgSnNvbkRhdGEgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5leHBvcnQgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cbmNvbnN0IGNvbG9yUGFsZXR0ZSA9IHtcbiAgbGlnaHQ6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiMwMDBcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjZmZmXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDI0MiwgNTUsIDU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYig1NywgMjE0LCAzOSlcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoNSwgMjgsIDE0MSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoMjEsIDEzNywgMjM5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM4ODhcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjZTVlNWU1XCIsXG4gIH0sXG4gIGRhcms6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiNmZmZcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjMjIyXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDE5OCwgMjAsIDApXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDk1LCAxNTksIDI1NSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoOTUsIDEwMCwgMjU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYigwLCAxODUsIDE5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM1NjU2NTZcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjNDE0MTQxXCIsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbG9yID0ge1xuICBjb2xvcjogXCJ2YXIoLS1jb2xvcilcIixcbiAgYmFja2dyb3VuZDogXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiLFxuICBibHVlOiBcInZhcigtLWJsdWUpXCIsXG4gIGxpZ2h0Qmx1ZTogXCJ2YXIoLS1saWdodGJsdWUpXCIsXG4gIHJlZDogXCJ2YXIoLS1yZWQpXCIsXG4gIGdyZWVuOiBcInZhcigtLWdyZWVuKVwiLFxuICBncmF5OiBcInZhcigtLWdyYXkpXCIsXG4gIGxpZ2h0Z3JheTogXCJ2YXIoLS1saWdodGdyYXkpXCJcbn1cblxuXG5sZXQgc3R5bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKVxuc3R5bC5pbm5lckhUTUwgPSBgXG46cm9vdCB7XG4gIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmRhcmsuY29sb3J9O1xuICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmFja2dyb3VuZH07XG4gIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5kYXJrLnJlZH07XG4gIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JlZW59O1xuICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmx1ZX07XG4gIC0tZ3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5ncmF5fTtcbiAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsubGlnaHRncmF5fTtcbiAgY29sb3I6IHZhcigtLWNvbG9yKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZCk7XG4gIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgOnJvb3Qge1xuICAgIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmNvbG9yfTtcbiAgICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJhY2tncm91bmR9O1xuICAgIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5saWdodC5yZWR9O1xuICAgIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyZWVufTtcbiAgICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJsdWV9O1xuICAgIC0tZ3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JheX07XG4gICAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmxpZ2h0Z3JheX07XG4gIH1cbn1cbmBcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bClcblxuZXhwb3J0IHR5cGUgaHRtbEtleSA9ICdpbm5lclRleHQnfCdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdvbmtleWRvd24nIHwgJ29ubW91c2VlbnRlcicgfCAnb25tb3VzZW92ZXInIHwgJ29ubW91c2VleGl0JyB8J2NoaWxkcmVuJ3wnY2xhc3MnfCdpZCd8J2NvbnRlbnRFZGl0YWJsZSd8J2V2ZW50TGlzdGVuZXJzJ3wnY29sb3InfCdiYWNrZ3JvdW5kJyB8ICdzdHlsZScgfCAncGxhY2Vob2xkZXInIHwgJ3RhYkluZGV4JyB8ICdjb2xTcGFuJyB8ICd0eXBlJ1xuZXhwb3J0IGNvbnN0IGh0bWxFbGVtZW50ID0gKHRhZzpzdHJpbmcsIHRleHQ6c3RyaW5nLCBhcmdzPzpQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+Pik6SFRNTEVsZW1lbnQgPT57XG5cbiAgY29uc3QgX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcbiAgX2VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gIGxldCBzdCA9IF9lbGVtZW50LnN0eWxlXG4gIGlmICh0YWcgPT0gXCJidXR0b25cIil7XG4gICAgX2VsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dFxuICAgIHN0LmNvbG9yID0gY29sb3IuY29sb3JcbiAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5saWdodGdyYXlcbiAgICBzdC5ib3JkZXIgPSBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5XG4gICAgc3QuYm9yZGVyUmFkaXVzID0gXCIuMmVtXCJcbiAgICBzdC5wYWRkaW5nID0gXCIuMWVtIC40ZW1cIlxuICAgIHN0Lm1hcmdpbiA9IFwiLjJlbVwiXG4gIH1cbiAgaWYgKGFyZ3MpIE9iamVjdC5lbnRyaWVzKGFyZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSk9PntcbiAgICBpZiAoa2V5ID09PSAncGFyZW50Jyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnQpLmFwcGVuZENoaWxkKF9lbGVtZW50KVxuICAgIH1cbiAgICBpZiAoa2V5PT09J2NoaWxkcmVuJyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnRbXSkuZm9yRWFjaChjPT5fZWxlbWVudC5hcHBlbmRDaGlsZChjKSlcbiAgICB9ZWxzZSBpZiAoa2V5PT09J2V2ZW50TGlzdGVuZXJzJyl7XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCAoZTpFdmVudCk9PnZvaWQ+KS5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSk9PntcbiAgICAgICAgX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgICB9KVxuICAgIH1lbHNlIGlmIChrZXkgPT09ICdzdHlsZScpe1xuICAgICAgT2JqZWN0LmFzc2lnbihfZWxlbWVudC5zdHlsZSwgdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilcbiAgICB9ZWxzZXtcbiAgICAgIF9lbGVtZW50WyhrZXkgYXMgJ2lubmVyVGV4dCcgfCAnb25jbGljaycgfCAnb25pbnB1dCcgfCAnaWQnIHwgJ2NvbnRlbnRFZGl0YWJsZScpXSA9IHZhbHVlXG4gICAgfVxuICB9KVxuICByZXR1cm4gX2VsZW1lbnRcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEFyZyA9IHN0cmluZyB8IG51bWJlciB8IEhUTUxFbGVtZW50IHwgUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gIHwgUHJvbWlzZTxIVE1MQXJnPiB8IEhUTUxBcmdbXSB8IEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgaHRtbCA9ICh0YWc6c3RyaW5nLCAuLi5jczpIVE1MQXJnW10pOkhUTUxFbGVtZW50PT57XG4gIGxldCBjaGlsZHJlbjogSFRNTEVsZW1lbnRbXSA9IFtdXG4gIGxldCBhcmdzOiBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiA9IHt9XG5cbiAgY29uc3QgYWRkX2FyZyA9IChhcmc6SFRNTEFyZyk9PntcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZykpXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZy50b1N0cmluZygpKSlcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBQcm9taXNlKXtcbiAgICAgIGNvbnN0IGVsID0gc3BhbihcIi4uLlwiKVxuICAgICAgYXJnLnRoZW4oKHZhbHVlKT0+e1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4odmFsdWUpKVxuICAgICAgfSlcbiAgICAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgfVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBjaGlsZHJlbi5wdXNoKGFyZylcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIGFyZy5mb3JFYWNoKHg9PmFkZF9hcmcoeCkpXG4gICAgLy8gZWxzZSBpZiAoJ2dldCcgaW4gYXJnICYmIHR5cGVvZiBhcmcuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gICBjb25zdCBlbCA9IHNwYW4oKVxuICAgIC8vICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICAvLyAgIGlmICgnb251cGRhdGUnIGluIGFyZyAmJiB0eXBlb2YgYXJnLm9udXBkYXRlID09PSAnZnVuY3Rpb24nKSBhcmcub251cGRhdGUoeD0+ZWwucmVwbGFjZUNoaWxkcmVuKHgpKVxuICAgIC8vIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09IFwiZnVuY3Rpb25cIil7XG4gICAgICBpZiAoYXJnLm5hbWUgPT0gXCJvbmlucHV0XCIpIGFyZ3Mub25pbnB1dCA9IGFyZ1xuICAgICAgZWxzZSBpZiAoYXJnLm5hbWUgPT0gXCJvbmNsaWNrXCIgfHwgYXJnLmxlbmd0aCA8IDIpIGFyZ3Mub25jbGljayA9IGFyZ1xuICAgICAgZWxzZSBjb25zb2xlLndhcm4oXCJGdW5jdGlvbiBhcmd1bWVudCB3aXRob3V0IG5hbWUgb3Igd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlciBpcyBpZ25vcmVkIGluIGh0bWwgZ2VuZXJhdG9yXCIpXG4gICAgfVxuICAgIGVsc2UgYXJncyA9IHsuLi5hcmdzLCAuLi5hcmd9XG4gIH1cbiAgY3MuZm9yRWFjaChhZGRfYXJnKVxuICByZXR1cm4gaHRtbEVsZW1lbnQodGFnLCBcIlwiLCB7Li4uYXJncywgY2hpbGRyZW59KVxufVxuXG5leHBvcnQgdHlwZSBIVE1MR2VuZXJhdG9yPFQgZXh0ZW5kcyBIVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50PiA9ICguLi5jczpIVE1MQXJnW10pID0+IFRcbmNvbnN0IG5ld0h0bWxHZW5lcmF0b3IgPSA8VCBleHRlbmRzIEhUTUxFbGVtZW50Pih0YWc6c3RyaW5nKT0+KC4uLmNzOkhUTUxBcmdbXSk6VD0+aHRtbCh0YWcsIC4uLmNzKSBhcyBUXG5cbmV4cG9ydCBjb25zdCBwOkhUTUxHZW5lcmF0b3I8SFRNTFBhcmFncmFwaEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInBcIilcbmV4cG9ydCBjb25zdCBhOkhUTUxHZW5lcmF0b3I8SFRNTEFuY2hvckVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImFcIilcbmV4cG9ydCBjb25zdCBoMTpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDFcIilcbmV4cG9ydCBjb25zdCBoMjpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDJcIilcbmV4cG9ydCBjb25zdCBoMzpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDNcIilcbmV4cG9ydCBjb25zdCBoNDpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDRcIilcblxuZXhwb3J0IGNvbnN0IGRpdjpIVE1MR2VuZXJhdG9yPEhUTUxEaXZFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJkaXZcIilcbmV4cG9ydCBjb25zdCBwcmU6SFRNTEdlbmVyYXRvcjxIVE1MUHJlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicHJlXCIpXG5leHBvcnQgY29uc3Qgc3BhbjpIVE1MR2VuZXJhdG9yPEhUTUxTcGFuRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwic3BhblwiKVxuZXhwb3J0IGNvbnN0IHRleHRhcmVhOkhUTUxHZW5lcmF0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGV4dGFyZWFcIilcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbjpIVE1MR2VuZXJhdG9yPEhUTUxCdXR0b25FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJidXR0b25cIilcbi8vIGV4cG9ydCBjb25zdCB0YWJsZSA9IChyb3dzOiBIVE1MQXJnW11bXSwgLi4uYXJnczogSFRNTEFyZ1tdKSA9PiBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIikoIHN0eWxlKHtib3JkZXJTcGFjaW5nOiBcIjFlbSAuNGVtXCJ9KSAsIHJvd3MubWFwKGNlbGxzPT50cihjZWxscy5tYXAoY2VsbD0+dGQoY2VsbCkpKSksIC4uLmFyZ3MpXG5leHBvcnQgY29uc3QgdGFibGU6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKVxuXG5leHBvcnQgY29uc3QgdHI6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVSb3dFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0clwiKVxuZXhwb3J0IGNvbnN0IHRkOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRkXCIpXG5leHBvcnQgY29uc3QgdGg6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGhcIilcbmV4cG9ydCBjb25zdCBjYW52YXM6SFRNTEdlbmVyYXRvcjxIVE1MQ2FudmFzRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiY2FudmFzXCIpXG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9ICguLi5ydWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdKSA9PiAoe3N0eWxlOiBPYmplY3QuYXNzaWduKHt9LCAuLi5ydWxlcyl9KVxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7bWFyZ2luOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgcGFkZGluZyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7cGFkZGluZzogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlciA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyUmFkaXVzID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXJSYWRpdXM6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCB3aWR0aCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7d2lkdGg6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBoZWlnaHQgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2hlaWdodDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGRpc3BsYXkgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2Rpc3BsYXk6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kID0gKHZhbHVlOiBzdHJpbmcgPSBcInZhcigtLWJhY2tncm91bmQpXCIpID0+IHN0eWxlKHtiYWNrZ3JvdW5kOiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBpbnB1dDpIVE1MR2VuZXJhdG9yPEhUTUxJbnB1dEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBjb250ZW50ID0gY3MuZmlsdGVyKGM9PnR5cGVvZiBjID09ICdzdHJpbmcnKS5qb2luKCcgJylcbiAgY29uc3QgZWwgPSBodG1sKFwiaW5wdXRcIiwgLi4uY3MpIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgZWwudmFsdWUgPSBjb250ZW50XG4gIHJldHVybiBlbFxufVxuXG5leHBvcnQgY29uc3Qgc2VsZWN0OkhUTUxHZW5lcmF0b3I8SFRNTFNlbGVjdEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBlbCA9IGh0bWwoXCJzZWxlY3RcIiwgLi4uY3MpIGFzIEhUTUxTZWxlY3RFbGVtZW50XG4gIGNzLmZpbHRlcihjPT50eXBlb2YgYyA9PSAnc3RyaW5nJykuZm9yRWFjaChjPT5lbC5vcHRpb25zLmFkZChuZXcgT3B0aW9uKGMgYXMgc3RyaW5nLCBjIGFzIHN0cmluZykpKVxuICBcbiAgcmV0dXJuIGVsXG59XG5cbmV4cG9ydCBjb25zdCBwb3B1cCA9ICguLi5jczpIVE1MQXJnW10pPT57XG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KHtcbiAgICBzdHlsZToge1xuICAgICAgYmFja2dyb3VuZDogY29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiBjb2xvci5jb2xvcixcbiAgICAgIHBhZGRpbmc6IFwiMWVtIDRlbVwiLFxuICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICBtaW5XaWR0aDogXCIyMHZ3XCIsXG4gICAgICBtYXhIZWlnaHQ6IFwiODB2aFwiLFxuICAgIH19LFxuICAgIC4uLmNzKVxuXG4gIGNvbnN0IHBvcHVwYmFja2dyb3VuZCA9IGRpdihcbiAgICB7c3R5bGU6e1xuICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgIHRvcDogXCIwXCIsXG4gICAgICBsZWZ0OiBcIjBcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMTY2LCAxNjYsIDE2NiwgMC41KVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgIH19XG4gIClcblxuICBwb3B1cGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoZGlhbG9nZmllbGQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcHVwYmFja2dyb3VuZCk7XG4gIHBvcHVwYmFja2dyb3VuZC5vbmNsaWNrID0gKCkgPT4ge3BvcHVwYmFja2dyb3VuZC5yZW1vdmUoKTsgfVxuICBkaWFsb2dmaWVsZC5vbmNsaWNrID0gKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5leHBvcnQgY29uc3QgZXJyb3Jwb3B1cCA9IChlOkVycm9yIHwgc3RyaW5nKSA9PntcbiAgcG9wdXAoZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6Y29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjpcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgcGFkZGluZzpcIjFlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOlwiLjRlbVwiLFxuICAgICAgY29sb3I6Y29sb3IucmVkLFxuICAgIH0pLFxuICAgIGgyKFwiRXJyb3JcIiksXG4gICAgcChTdHJpbmcoZSkpXG4gICkpXG4gIHRocm93IChlIGluc3RhbmNlb2YgRXJyb3IpID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbExpc3QoaXRlbXM6IHt0aXRsZTogSFRNTEFyZywgY29udGVudDogSFRNTEFyZ31bXSl7XG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgZ2FwOiBcIjFlbVwiLFxuICAgIH0pLFxuICAgIC4uLml0ZW1zLm1hcChmPT5kaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi40ZW1cIixcbiAgICAgICAgcGFkZGluZzogXCIuNWVtIDFlbVwiLFxuICAgICAgfSksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi50aXRsZVxuICAgICAgKSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLmNvbnRlbnRcbiAgICAgIClcbiAgICApKVxuICApXG59XG5cblxuXG5cbiIsCiAgICAiXG5pbXBvcnQgdHlwZSB7IE1vZHVsZSwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuLy8gaW1wb3J0IHsgZmluZFBhdGggfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgZGl2LCBwLCBzdHlsZSB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzIH0gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IGdlcm1hbnlPdXRsaW5lIGZyb20gXCIuL2dlcm1hbnlfb3V0bGluZS5qc29uXCI7XG5cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiwgeDogbnVtYmVyLCB5OiBudW1iZXIpIDoge2VsOiBTVkdDaXJjbGVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJsaW5lXCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIpIDoge2VsOiBTVkdMaW5lRWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwidGV4dFwiLCB4OiBudW1iZXIsIHk6IG51bWJlciwgczogc3RyaW5nKSA6IHtlbDogU1ZHVGV4dEVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwiY2lyY2xlXCIgfCBcImxpbmVcIiB8IFwidGV4dFwiLCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4Mj86IG51bWJlciB8IHN0cmluZywgeTI/OiBudW1iZXIpe1xuICBsZXQgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCB0YWcpXG4gIGlmICh0YWcgPT0gXCJjaXJjbGVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiY3hcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjAxXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4ge1xuICAgICAgZWwsXG4gICAgICBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcImxpbmVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDFcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5MVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcIngyXCIsIHgyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkyXCIsIHkyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZVwiLCBcImdyYXlcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAwNVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIGNvbG9yKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICh0YWcgPT0gXCJ0ZXh0XCIpe1xuICAgIGVsLnNldEF0dHJpYnV0ZShcInhcIix4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInlcIiwgeTEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgZWwudGV4dENvbnRlbnQgPSBTdHJpbmcoeDIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiLjA3XCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcblxuICAgIHJldHVybiB7IGVsLCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57IGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpIH0gfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgdGFnXCIpXG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gbWFwVmlldyAoIG1vZDogTW9kdWxlICkgOiBIVE1MRWxlbWVudCB7XG5cbiAgbGV0IHtyb2FkbWFwLCBNQVBTSVpFfSA9IG1vZFxuICBjb25zdCByZWFsTWFwID0gXCJEdXJhdGlvbk1hdHJpeFwiIGluIHJvYWRtYXBcbiAgY29uc3QgeHMgPSByb2FkbWFwLnBvaW50cy5tYXAocG9pbnQgPT4gcG9pbnQueClcbiAgY29uc3QgeXMgPSByb2FkbWFwLnBvaW50cy5tYXAocG9pbnQgPT4gcG9pbnQueSlcbiAgY29uc3QgbWluWCA9IHJlYWxNYXAgPyA1LjUgOiAwXG4gIGNvbnN0IG1heFggPSByZWFsTWFwID8gMTUuNSA6IE1BUFNJWkVcbiAgY29uc3QgbWluWSA9IHJlYWxNYXAgPyA0Ny4yIDogMFxuICBjb25zdCBtYXhZID0gcmVhbE1hcCA/IDU1LjEgOiBNQVBTSVpFXG4gIC8vIEF0IEdlcm1hbnkncyBsYXRpdHVkZSwgb25lIGRlZ3JlZSBvZiBsb25naXR1ZGUgaXMgb25seSBhYm91dCA2MyUgb2Ygb25lIGRlZ3JlZVxuICAvLyBvZiBsYXRpdHVkZS4gS2VlcCB0aGF0IGdlb2dyYXBoaWMgYXNwZWN0IHJhdGlvIGluc3RlYWQgb2Ygc3RyZXRjaGluZyBib3RoIGF4ZXMuXG4gIGNvbnN0IHByb2plY3RYID0gKHg6IG51bWJlcikgPT4gcmVhbE1hcFxuICAgID8gLjEzNSArIC43MyAqICh4IC0gbWluWCkgLyBNYXRoLm1heChtYXhYIC0gbWluWCwgMWUtOSlcbiAgICA6IHggLyBNQVBTSVpFXG4gIGNvbnN0IHByb2plY3RZID0gKHk6IG51bWJlcikgPT4gcmVhbE1hcFxuICAgID8gLjk2IC0gLjkyICogKHkgLSBtaW5ZKSAvIE1hdGgubWF4KG1heFkgLSBtaW5ZLCAxZS05KVxuICAgIDogeSAvIE1BUFNJWkVcblxuXG5cbiAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKVxuXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCI4MCVcIilcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCI4MCVcIilcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiMCAwIDEgMVwiKVxuXG4gIGxldCBlbGVtZW50cyA9IG5ldyBNYXA8YW55LCBTVkdFbGVtZW50PigpXG4gIGxldCBzb3VyY2VzID0gbmV3IE1hcDxTVkdFbGVtZW50LCBhbnk+KClcblxuICBpZiAocmVhbE1hcCkge1xuICAgIGNvbnN0IG91dGxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInBhdGhcIilcbiAgICBvdXRsaW5lLnNldEF0dHJpYnV0ZShcImRcIiwgZ2VybWFueU91dGxpbmUubWFwKHBvbHlnb24gPT5cbiAgICAgIHBvbHlnb24ubWFwKHJpbmcgPT4gcmluZy5tYXAoKFtsb24sIGxhdF0sIGluZGV4KSA9PlxuICAgICAgICBgJHtpbmRleCA9PT0gMCA/IFwiTVwiIDogXCJMXCJ9JHtwcm9qZWN0WChsb24hKX0gJHtwcm9qZWN0WShsYXQhKX1gXG4gICAgICApLmpvaW4oXCIgXCIpICsgXCIgWlwiKS5qb2luKFwiIFwiKVxuICAgICkuam9pbihcIiBcIikpXG4gICAgb3V0bGluZS5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiI2YxZjRmMFwiKVxuICAgIG91dGxpbmUuc2V0QXR0cmlidXRlKFwiZmlsbC1ydWxlXCIsIFwiZXZlbm9kZFwiKVxuICAgIG91dGxpbmUuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiIzgyOTA4N1wiKVxuICAgIG91dGxpbmUuc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiMC4wMDNcIilcbiAgICBvdXRsaW5lLnNldEF0dHJpYnV0ZShcInZlY3Rvci1lZmZlY3RcIiwgXCJub24tc2NhbGluZy1zdHJva2VcIilcbiAgICBvdXRsaW5lLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIlxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob3V0bGluZSlcbiAgfVxuICBcbiAgLy8gQSByZWFsIHJvYWRtYXAncyBtYXRyaXggaXMgY29tcGxldGUsIHNvIGRyYXdpbmcgZXZlcnkgbWF0cml4IHBhaXIgd291bGQgY3JlYXRlXG4gIC8vIHRlbnMgb2YgdGhvdXNhbmRzIG9mIGxpbmVzLiBTeW50aGV0aWMgbWFwcyBzdGlsbCBzaG93IHRoZWlyIGdlbmVyYXRlZCByb2Fkcy5cbiAgZm9yIChsZXQgeCA9MCA7ICFyZWFsTWFwICYmIHggPCByb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgZm9yIChsZXQgeSA9IDA7IHk8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeSsrKXtcbiAgICAgIGlmICh4ID09IHkpIGNvbnRpbnVlXG4gICAgICBsZXQgbGVuID0gcm9hZG1hcC5nZXRyb2FkKHgseSlcbiAgICAgIGlmIChsZW4gPT0gMCB8fCBsZW4gPT0gdW5kZWZpbmVkKSBjb250aW51ZSAgXG5cblxuICAgICAgbGV0IGEgPSByb2FkbWFwLnBvaW50c1t4XSFcbiAgICAgIGxldCBiID0gcm9hZG1hcC5wb2ludHNbeV0hXG4gICAgICBsZXQgbGluZSA9IG1rU3ZnKFwibGluZVwiLCBwcm9qZWN0WChhLngpLCBwcm9qZWN0WShhLnkpLCBwcm9qZWN0WChiLngpLCBwcm9qZWN0WShiLnkpKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBwcm9qZWN0WChsb2MueCksIHByb2plY3RZKGxvYy55KSkuZWxcbiAgICBpZiAocmVhbE1hcCkgY2lyY2xlLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjAwNFwiKVxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cbiAgbGV0IGhpZ2hsaWdodFZlcnNpb24gPSAwXG4gIGNvbnN0IGdlb21ldHJ5Q2FjaGUgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxudW1iZXJbXVtdIHwgbnVsbD4+KClcblxuICBmdW5jdGlvbiByb3V0ZUdlb21ldHJ5KGZyb206IG51bWJlciwgdG86IG51bWJlcikge1xuICAgIGNvbnN0IGEgPSBNYXRoLm1pbihmcm9tLCB0byksIGIgPSBNYXRoLm1heChmcm9tLCB0bylcbiAgICBjb25zdCBrZXkgPSBgJHthfS0ke2J9YFxuICAgIGxldCBnZW9tZXRyeSA9IGdlb21ldHJ5Q2FjaGUuZ2V0KGtleSlcbiAgICBpZiAoIWdlb21ldHJ5KSB7XG4gICAgICBnZW9tZXRyeSA9IGZldGNoKGAuL3JvdXRlLWdlb21ldHJ5P2Zyb209JHthfSZ0bz0ke2J9YClcbiAgICAgICAgLnRoZW4oYXN5bmMgcmVzcG9uc2UgPT4gcmVzcG9uc2Uub2sgPyAoYXdhaXQgcmVzcG9uc2UuanNvbigpIGFzIHtjb29yZGluYXRlczogbnVtYmVyW11bXX0pLmNvb3JkaW5hdGVzIDogbnVsbClcbiAgICAgICAgLmNhdGNoKCgpID0+IG51bGwpXG4gICAgICBnZW9tZXRyeUNhY2hlLnNldChrZXksIGdlb21ldHJ5KVxuICAgIH1cbiAgICByZXR1cm4gZ2VvbWV0cnkudGhlbihjb29yZGluYXRlcyA9PiBjb29yZGluYXRlcyAmJiBmcm9tID4gdG8gPyBbLi4uY29vcmRpbmF0ZXNdLnJldmVyc2UoKSA6IGNvb3JkaW5hdGVzKVxuICB9XG5cbiAgZnVuY3Rpb24gcm91dGVQYXRoKGNvb3JkaW5hdGVzOiBudW1iZXJbXVtdLCBjb2xvcjogc3RyaW5nKSB7XG4gICAgY29uc3QgcGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicGF0aFwiKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwiZFwiLCBjb29yZGluYXRlcy5tYXAoKFtsb24sIGxhdF0sIGluZGV4KSA9PlxuICAgICAgYCR7aW5kZXggPT09IDAgPyBcIk1cIiA6IFwiTFwifSR7cHJvamVjdFgobG9uISl9ICR7cHJvamVjdFkobGF0ISl9YFxuICAgICkuam9pbihcIiBcIikpXG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIGNvbG9yKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiLjAwNlwiKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwic3Ryb2tlLWxpbmVjYXBcIiwgXCJyb3VuZFwiKVxuICAgIHBhdGguc2V0QXR0cmlidXRlKFwic3Ryb2tlLWxpbmVqb2luXCIsIFwicm91bmRcIilcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKHBhdGgpXG4gICAgcmV0dXJuIHsgcmVtb3ZlOiAoKSA9PiBwYXRoLnJlbW92ZSgpIH1cbiAgfVxuXG4gIGhpZ2h0TGlnaHRzLm9udXBkYXRlKChuSCxvKT0+e1xuICAgIGNvbnN0IHZlcnNpb24gPSArK2hpZ2hsaWdodFZlcnNpb25cbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBoaW50cyA9IFtdXG4gICAgZm9yIChsZXQgbiBvZiBuSCl7XG4gICAgICBsZXQgbGFzdCA6IG51bWJlciB8IG51bGwgPSBudWxsXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgbGV0IG5leHQgPSBwLm51bWJlclxuICAgICAgICBpZiAobGFzdCAhPT0gbnVsbCl7XG4gICAgICAgICAgbGV0IEEgPSByb2FkbWFwLnBvaW50c1tsYXN0XSFcbiAgICAgICAgICBsZXQgQiA9IHJvYWRtYXAucG9pbnRzW25leHRdIVxuICAgICAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIHByb2plY3RYKEEueCksIHByb2plY3RZKEEueSksIHByb2plY3RYKEIueCksIHByb2plY3RZKEIueSkpXG4gICAgICAgICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIGxpbmUuZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiMC4wMVwiKVxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICBjb25zdCBmYWxsYmFjayA9IHtyZW1vdmU6ICgpPT5saW5lLmVsLnJlbW92ZSgpfVxuICAgICAgICAgIGhpbnRzLnB1c2goZmFsbGJhY2spXG4gICAgICAgICAgaWYgKHJlYWxNYXAgJiYgbGFzdCAhPT0gbmV4dCkge1xuICAgICAgICAgICAgdm9pZCByb3V0ZUdlb21ldHJ5KGxhc3QsIG5leHQpLnRoZW4oY29vcmRpbmF0ZXMgPT4ge1xuICAgICAgICAgICAgICBpZiAodmVyc2lvbiAhPT0gaGlnaGxpZ2h0VmVyc2lvbiB8fCAhY29vcmRpbmF0ZXMpIHJldHVyblxuICAgICAgICAgICAgICBmYWxsYmFjay5yZW1vdmUoKVxuICAgICAgICAgICAgICBoaW50cyA9IGhpbnRzLmZpbHRlcihoaW50ID0+IGhpbnQgIT09IGZhbGxiYWNrKVxuICAgICAgICAgICAgICBoaW50cy5wdXNoKHJvdXRlUGF0aChjb29yZGluYXRlcywgbi5jb2xvciA/PyBcIiNmZmM5ODhcIikpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHByb2plY3RYKHBvcy54KSwgcHJvamVjdFkocG9zLnkpLCBwLmxvZ28pXG4gICAgICAgICAgaWYgKHJlYWxNYXApIGVsLmVsLnNldEF0dHJpYnV0ZShcImZvbnQtc2l6ZVwiLCBcIi4wMzVcIilcbiAgICAgICAgICBlbC5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwMFwiKVxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZWwuZWwpXG4gICAgICAgICAgaGludHMucHVzaChlbC5lbClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICBsZXQgZHYgPSBkaXYoc3R5bGUoe3dpZHRoOlwiMTAwJVwiLCBkaXNwbGF5OlwiZmxleFwiLCBqdXN0aWZ5Q29udGVudDpcImNlbnRlclwiLCBwYWRkaW5nOiBcIjFlbVwifSkpXG4gIGR2LmFwcGVuZChlbGVtZW50KVxuXG5cbiAgcmV0dXJuIGR2XG59XG4iLAogICAgIlxuXG5cbmxldCBSQU5EU0VFRCA9IDBcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFJhbmRTZWVkKHNlZWQ6IG51bWJlcil7XG4gIFJBTkRTRUVEID0gc2VlZFxuICBSQU5EU0VFRCA9IHJhbmRJbnQoMCwgMTAwMDApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBvcnRTdGF0ZSAoKSB7cmV0dXJuIFJBTkRTRUVEfVxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRTdGF0ZSAoc2VlZDogbnVtYmVyKSB7UkFORFNFRUQgPSBzZWVkfVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tKCl7XG4gIGxldCB4ID0gTWF0aC5zaW4oUkFORFNFRUQrKykgKiAxMDAwMDtcbiAgcmV0dXJuIHggLSBNYXRoLmZsb29yKHgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZEludChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpe1xuICByZXR1cm4gTWF0aC5mbG9vcihyYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pblxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZENob2ljZTxUPihhcnI6IFRbXSk6IFQge1xuICByZXR1cm4gYXJyW3JhbmRJbnQoMCwgYXJyLmxlbmd0aCldIVxufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuL3JhbmRvbVwiO1xuXG5leHBvcnQgdHlwZSBQb3MgPSB7eDpudW1iZXIsIHk6IG51bWJlcn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tTWFwIChOUE9JTlRTOm51bWJlciwgTUFQU0laRTpudW1iZXIpe1xuXG4gIGxldCBIUE9JTlQgPSBOUE9JTlRTLzJcbiAgbGV0IFJTSVpFID0gTlBPSU5UUyAqIEhQT0lOVFxuXG5cbiAgbGV0IHJvYWRzID0gbmV3IFVpbnQxNkFycmF5KFJTSVpFKVxuXG4gIGZ1bmN0aW9uIHJvYWRJRFggIChhOm51bWJlciwgYjpudW1iZXIpe1xuICAgIGlmIChhPGIpIFthLGJdID0gW2IsYV1cbiAgICBsZXQgaWR4ID0gYSArIE5QT0lOVFMgKiBiXG4gICAgaWYgKGlkeD5SU0laRSkgaWR4ID0gTlBPSU5UUyoqMiAtIGlkeFxuXG4gICAgcmV0dXJuIGlkeCBcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyKSB7XG4gICAgaWYgKGE9PWIpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBnZXQgcm9hZCBmcm9tIGEgcG9pbnQgdG8gaXRzZWxmXCIpXG4gICAgcmV0dXJuIHJvYWRzW3JvYWRJRFgoYSxiKV0hXG4gIH1cblxuICBmdW5jdGlvbiBzZXRyb2FkIChhOiBudW1iZXIsIGI6IG51bWJlciwgZGlzdDogbnVtYmVyKSB7XG4gICAgaWYgKGE9PWIpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBzZXQgcm9hZCBmcm9tIGEgcG9pbnQgdG8gaXRzZWxmXCIpXG4gICAgcm9hZHNbcm9hZElEWChhLGIpXSA9IGRpc3RcbiAgfVxuXG4gIGxldCByYW5nZSA9IEFycmF5LmZyb20oe2xlbmd0aDogTlBPSU5UU30sIChfLGkpPT4gaSlcbiAgbGV0IHBvaW50cyA6IFBvc1tdID0gcmFuZ2UubWFwKCgpPT4oe3g6IHJhbmRJbnQoMCxNQVBTSVpFKSwgeTogcmFuZEludCgwLE1BUFNJWkUpfSkpXG4gIGxldCBuZWlnaHMgPSBwb2ludHMubWFwKChwcyxpKT0+XG4gICAgcG9pbnRzLm1hcCgocDIsIGkyKT0+ICAoe2Q6IE1hdGguZmxvb3IoTWF0aC5oeXBvdChwcy54IC0gcDIueCwgcHMueSAtIHAyLnkpKSwgaTogaTJ9KSlcbiAgICAuZmlsdGVyKHggPT4geC5pICE9IGkpIC5zb3J0KChhLGIpPT4gYS5kIC0gYi5kKSApXG5cbiAgZnVuY3Rpb24gY29ubmVjdChhOiBudW1iZXIsIGI6IG51bWJlciwgZGlzdDogbnVtYmVyKXtcbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuXG4gICAgaWYgKGdldHJvYWQoYSwgYikgIT09IDApIHJldHVyblxuICAgIHNldHJvYWQoYSwgYiwgZGlzdClcbiAgfVxuXG4gIC8vIEJ1aWxkIGEgY29ubmVjdGVkIGJhY2tib25lIGJ5IHJlcGVhdGVkbHkgYXR0YWNoaW5nIHRoZSBuZWFyZXN0IHVuY29ubmVjdGVkIHBvaW50LlxuICBjb25zdCBjb25uZWN0ZWQgPSBuZXcgU2V0PG51bWJlcj4oWzBdKVxuICB3aGlsZSAoY29ubmVjdGVkLnNpemUgPCBOUE9JTlRTKXtcbiAgICBsZXQgYmVzdEEgPSAtMVxuICAgIGxldCBiZXN0QiA9IC0xXG4gICAgbGV0IGJlc3REID0gSW5maW5pdHlcblxuICAgIGZvciAoY29uc3QgYSBvZiBjb25uZWN0ZWQpe1xuICAgICAgZm9yIChjb25zdCBuZWkgb2YgbmVpZ2hzW2FdID8/IFtdKXtcbiAgICAgICAgaWYgKGNvbm5lY3RlZC5oYXMobmVpLmkpKSBjb250aW51ZVxuICAgICAgICBpZiAobmVpLmQgPCBiZXN0RCl7XG4gICAgICAgICAgYmVzdEEgPSBhXG4gICAgICAgICAgYmVzdEIgPSBuZWkuaVxuICAgICAgICAgIGJlc3REID0gbmVpLmRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChiZXN0QSA9PT0gLTEgfHwgYmVzdEIgPT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gY29ubmVjdCByYW5kb20gbWFwXCIpXG4gICAgY29ubmVjdChiZXN0QSwgYmVzdEIsIGJlc3REKVxuICAgIGNvbm5lY3RlZC5hZGQoYmVzdEIpXG4gIH1cblxuICAvLyBBZGQgYSBmZXcgZXh0cmEgbG9jYWwgcm9hZHMgc28gdGhlIG1hcCBpcyBub3QganVzdCBhIHRyZWUuXG4gIGZvciAobGV0IHggPSAwOyB4IDwgTlBPSU5UUzsgeCsrKXtcbiAgICBjb25zdCBleHRyYUVkZ2VzID0gMiArIHJhbmRJbnQoMCwgMylcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4dHJhRWRnZXM7IGkrKyl7XG4gICAgICBjb25zdCBueCA9IG5laWdoc1t4XT8uW2ldXG4gICAgICBpZiAoIW54KSBjb250aW51ZVxuICAgICAgY29ubmVjdCh4LCBueC5pLCBueC5kKVxuICAgIH1cbiAgfVxuXG5cblxuXG4gIGNvbnN0IENvc3RNYXRyaXggPSBuZXcgVWludDMyQXJyYXkoUlNJWkUpO1xuXG4gIHtcbiAgXG4gICAgY29uc3QgcG9pbnRDb3VudCA9IHBvaW50cy5sZW5ndGg7XG4gICAgY29uc3QgSU5GID0gMHhmZmZmO1xuICBcbiAgICBDb3N0TWF0cml4LmZpbGwoSU5GKTtcbiAgXG4gICAgZm9yIChsZXQgc3RhcnQgPSAwOyBzdGFydCA8IHBvaW50Q291bnQ7IHN0YXJ0KyspIHtcbiAgICAgIGNvbnN0IGRpc3QgPSBuZXcgVWludDMyQXJyYXkocG9pbnRDb3VudCk7XG4gICAgICBjb25zdCB2aXNpdGVkID0gbmV3IFVpbnQ4QXJyYXkocG9pbnRDb3VudCk7XG4gICAgICBkaXN0LmZpbGwoSU5GKTtcbiAgICAgIGRpc3Rbc3RhcnRdID0gMDtcbiAgXG4gICAgICBmb3IgKGxldCBzdGVwID0gMDsgc3RlcCA8IHBvaW50Q291bnQ7IHN0ZXArKykge1xuICAgICAgICBsZXQgY3VycmVudCA9IC0xO1xuICAgICAgICBsZXQgYmVzdCA9IElORjtcbiAgXG4gICAgICAgIGZvciAobGV0IG5vZGUgPSAwOyBub2RlIDwgcG9pbnRDb3VudDsgbm9kZSsrKSB7XG4gICAgICAgICAgaWYgKHZpc2l0ZWRbbm9kZV0gPT09IDAgJiYgZGlzdFtub2RlXSEgPCBiZXN0KSB7XG4gICAgICAgICAgICBiZXN0ID0gZGlzdFtub2RlXSE7XG4gICAgICAgICAgICBjdXJyZW50ID0gbm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgXG4gICAgICAgIGlmIChjdXJyZW50ID09PSAtMSkgYnJlYWs7XG4gICAgICAgIHZpc2l0ZWRbY3VycmVudF0gPSAxO1xuICBcbiAgICAgICAgZm9yIChsZXQgbmV4dCA9IDA7IG5leHQgPCBwb2ludENvdW50OyBuZXh0KyspIHtcbiAgICAgICAgICBpZiAobmV4dCA9PT0gY3VycmVudCkgY29udGludWU7XG4gICAgICAgICAgY29uc3Qgcm9hZCA9IGdldHJvYWQoY3VycmVudCwgbmV4dCk7XG4gICAgICAgICAgaWYgKHJvYWQgPT09IDApIGNvbnRpbnVlO1xuICAgICAgICAgIGNvbnN0IG5leHRDb3N0ID0gZGlzdFtjdXJyZW50XSEgKyByb2FkO1xuICAgICAgICAgIGlmIChuZXh0Q29zdCA8IGRpc3RbbmV4dF0hKSB7XG4gICAgICAgICAgICBkaXN0W25leHRdID0gbmV4dENvc3Q7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gIFxuICAgICAgZm9yIChsZXQgZW5kID0gMDsgZW5kIDwgcG9pbnRDb3VudDsgZW5kKyspIHtcbiAgICAgICAgaWYgKGVuZCA9PT0gc3RhcnQpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBpZHggPSByb2FkSURYKHN0YXJ0LCBlbmQpO1xuICAgICAgICBDb3N0TWF0cml4W2lkeF0gPSBNYXRoLm1pbihkaXN0W2VuZF0hLCBJTkYpO1xuICAgICAgfVxuICAgIH1cbiAgXG4gIH1cblxuXG5cbiAgZnVuY3Rpb24gZmluZFBhdGgoc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpOm51bWJlcltdIHtcblxuICAgIGxldCBwYXRoIDogbnVtYmVyW10gPSBbc3RhcnRdXG4gICAgbGV0IGNvc3QgPSBDb3N0TWF0cml4W3JvYWRJRFgoc3RhcnQsZW5kKV1cbiAgICB3aGlsZSAoc3RhcnQgIT0gZW5kKXtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgcG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICAgICAgaWYgKHggPT0gc3RhcnQpIGNvbnRpbnVlXG4gICAgICAgIGxldCByb2FkID0gZ2V0cm9hZChzdGFydCx4KVxuICAgICAgICBpZiAocm9hZCA9PSAwKSBjb250aW51ZVxuICAgICAgICBsZXQgcmVzdGNvc3QgPSBDb3N0TWF0cml4W3JvYWRJRFgoeCxlbmQpXSFcbiAgICAgICAgaWYgKHJvYWQrIHJlc3Rjb3N0ID09IGNvc3Qpe1xuICAgICAgICAgIGNvc3QgPSByZXN0Y29zdFxuICAgICAgICAgIHN0YXJ0ID0geFxuICAgICAgICAgIHBhdGgucHVzaCh4KVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhdGhcbiAgfVxuICBcbiAgZnVuY3Rpb24gZ2V0Q29zdE4oLi4ucG9pbnRzOiBudW1iZXJbXSk6IG51bWJlciB7XG4gIFxuICAgIGxldCBjb3N0ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGlmIChwb2ludHNbaV0gIT09IHBvaW50c1tpICsgMV0pIGNvc3QgKz0gQ29zdE1hdHJpeFtyb2FkSURYKHBvaW50c1tpXSEsIHBvaW50c1tpICsgMV0hKV0hO1xuICAgIH1cbiAgICByZXR1cm4gY29zdDtcbiAgfVxuXG5cbiAgcmV0dXJuIHsgZ2V0cm9hZCwgcm9hZElEWCwgcG9pbnRzLCByYW5nZSwgQ29zdE1hdHJpeCwgZmluZFBhdGgsIGdldENvc3ROfVxufVxuXG5cbmV4cG9ydCB0eXBlIFJvYWRNYXAgPSB0eXBlb2YgcmFuZG9tTWFwIGV4dGVuZHMgKC4uLng6YW55KSA9PiAoaW5mZXIgVCkgPyBUIDogbmV2ZXJcbiIsCiAgICAidHlwZSBKc29uVmFsdWUgPVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCBudWxsXG4gIHwgeyBba2V5OiBzdHJpbmddOiBKc29uVmFsdWUgfVxuICB8IEpzb25WYWx1ZVtdXG5cbnR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cblxuY29uc3QgdHlwZU5hbWUgPSAodmFsdWU6IHVua25vd24pOiBzdHJpbmcgPT4ge1xuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBcIm51bGxcIlxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiBcImFycmF5XCJcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZVxufVxuXG5jb25zdCBwYXRoTGFiZWwgPSAocGF0aDogc3RyaW5nKTogc3RyaW5nID0+IHBhdGggfHwgXCIkXCJcblxuY29uc3QgZmFpbCA9IChwYXRoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyk6IG5ldmVyID0+IHtcbiAgdGhyb3cgbmV3IEVycm9yKGBWYWxpZGF0aW9uIGVycm9yIGF0ICR7cGF0aExhYmVsKHBhdGgpfTogJHttZXNzYWdlfWApXG59XG5cbmNvbnN0IGlzUGxhaW5PYmplY3QgPSAodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9PlxuICB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpXG5cbmNvbnN0IGRlZXBFcXVhbCA9IChsZWZ0OiB1bmtub3duLCByaWdodDogdW5rbm93bik6IGJvb2xlYW4gPT4ge1xuICBpZiAoT2JqZWN0LmlzKGxlZnQsIHJpZ2h0KSkgcmV0dXJuIHRydWVcbiAgaWYgKEFycmF5LmlzQXJyYXkobGVmdCkgJiYgQXJyYXkuaXNBcnJheShyaWdodCkpIHtcbiAgICByZXR1cm4gbGVmdC5sZW5ndGggPT09IHJpZ2h0Lmxlbmd0aCAmJiBsZWZ0LmV2ZXJ5KCh2YWx1ZSwgaW5kZXgpID0+IGRlZXBFcXVhbCh2YWx1ZSwgcmlnaHRbaW5kZXhdKSlcbiAgfVxuICBpZiAoaXNQbGFpbk9iamVjdChsZWZ0KSAmJiBpc1BsYWluT2JqZWN0KHJpZ2h0KSkge1xuICAgIGNvbnN0IGxlZnRLZXlzID0gT2JqZWN0LmtleXMobGVmdClcbiAgICBjb25zdCByaWdodEtleXMgPSBPYmplY3Qua2V5cyhyaWdodClcbiAgICByZXR1cm4gbGVmdEtleXMubGVuZ3RoID09PSByaWdodEtleXMubGVuZ3RoXG4gICAgICAmJiBsZWZ0S2V5cy5ldmVyeShrZXkgPT4ga2V5IGluIHJpZ2h0ICYmIGRlZXBFcXVhbChsZWZ0W2tleV0sIHJpZ2h0W2tleV0pKVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5jb25zdCBhcHBlbmRQYXRoID0gKHBhdGg6IHN0cmluZywgcGFydDogc3RyaW5nKTogc3RyaW5nID0+XG4gIHBhdGggPyBgJHtwYXRofSR7cGFydH1gIDogYCQke3BhcnR9YFxuXG5jb25zdCB2YWxpZGF0ZU9iamVjdCA9IChzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgb2JqZWN0LCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgY29uc3Qgb2JqZWN0VmFsdWUgPSB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuXG4gIGNvbnN0IHByb3BlcnRpZXMgPSBpc1BsYWluT2JqZWN0KHNjaGVtYS5wcm9wZXJ0aWVzKSA/IHNjaGVtYS5wcm9wZXJ0aWVzIDoge31cbiAgY29uc3QgcmVxdWlyZWQgPSBBcnJheS5pc0FycmF5KHNjaGVtYS5yZXF1aXJlZCkgPyBzY2hlbWEucmVxdWlyZWQgOiBbXVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIHJlcXVpcmVkKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgIT09IFwic3RyaW5nXCIpIGNvbnRpbnVlXG4gICAgaWYgKCEoa2V5IGluIG9iamVjdFZhbHVlKSkgZmFpbChhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCksIFwiaXMgcmVxdWlyZWRcIilcbiAgfVxuXG4gIGZvciAoY29uc3QgW2tleSwgcHJvcGVydHlTY2hlbWFdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BlcnRpZXMpKSB7XG4gICAgaWYgKCEoa2V5IGluIG9iamVjdFZhbHVlKSkgY29udGludWVcbiAgICBpZiAoIWlzUGxhaW5PYmplY3QocHJvcGVydHlTY2hlbWEpKSBjb250aW51ZVxuICAgIHZhbGlkYXRlSnNvblNjaGVtYShwcm9wZXJ0eVNjaGVtYSBhcyBKU09OU2NoZW1hLCBvYmplY3RWYWx1ZVtrZXldLCBhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCkpXG4gIH1cblxuICBjb25zdCBleHRyYUtleXMgPSBPYmplY3Qua2V5cyhvYmplY3RWYWx1ZSkuZmlsdGVyKGtleSA9PiAhKGtleSBpbiBwcm9wZXJ0aWVzKSlcbiAgY29uc3QgYWRkaXRpb25hbCA9IHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllc1xuICBpZiAoYWRkaXRpb25hbCA9PT0gZmFsc2UpIHtcbiAgICBpZiAoZXh0cmFLZXlzLmxlbmd0aCA+IDApIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7ZXh0cmFLZXlzWzBdfWApLCBcImFkZGl0aW9uYWwgcHJvcGVydGllcyBhcmUgbm90IGFsbG93ZWRcIilcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmIChpc1BsYWluT2JqZWN0KGFkZGl0aW9uYWwpKSB7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgZXh0cmFLZXlzKSB7XG4gICAgICB2YWxpZGF0ZUpzb25TY2hlbWEoYWRkaXRpb25hbCBhcyBKU09OU2NoZW1hLCBvYmplY3RWYWx1ZVtrZXldLCBhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCkpXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IHZhbGlkYXRlQXJyYXkgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIGFycmF5LCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgY29uc3QgYXJyYXlWYWx1ZSA9IHZhbHVlIGFzIHVua25vd25bXVxuICBpZiAoIWlzUGxhaW5PYmplY3Qoc2NoZW1hLml0ZW1zKSkgcmV0dXJuXG4gIGFycmF5VmFsdWUuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHZhbGlkYXRlSnNvblNjaGVtYShzY2hlbWEuaXRlbXMgYXMgSlNPTlNjaGVtYSwgaXRlbSwgYXBwZW5kUGF0aChwYXRoLCBgWyR7aW5kZXh9XWApKSlcbn1cblxuY29uc3QgdmFsaWRhdGVCeVR5cGUgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIHN3aXRjaCAoc2NoZW1hLnR5cGUpIHtcbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBzdHJpbmcsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIiB8fCBOdW1iZXIuaXNOYU4odmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudW1iZXIsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwiYm9vbGVhblwiKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBib29sZWFuLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudWxsXCI6XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG51bGwsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcImFycmF5XCI6XG4gICAgICB2YWxpZGF0ZUFycmF5KHNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICB2YWxpZGF0ZU9iamVjdChzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICByZXR1cm5cbiAgICBkZWZhdWx0OlxuICAgICAgZmFpbChwYXRoLCBgdW5zdXBwb3J0ZWQgc2NoZW1hIHR5cGUgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEudHlwZSl9YClcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGVKc29uU2NoZW1hID0gPFQ+KHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGggPSBcIlwiKTogVCA9PiB7XG4gIGlmIChcImNvbnN0XCIgaW4gc2NoZW1hICYmICFkZWVwRXF1YWwodmFsdWUsIHNjaGVtYS5jb25zdCkpIHtcbiAgICBmYWlsKHBhdGgsIGBleHBlY3RlZCBjb25zdGFudCAke0pTT04uc3RyaW5naWZ5KHNjaGVtYS5jb25zdCl9YClcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbnlPZikpIHtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW11cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBzY2hlbWEuYW55T2YpIHtcbiAgICAgIGlmICghaXNQbGFpbk9iamVjdChvcHRpb24pKSBjb250aW51ZVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICAgIGZhaWwocGF0aCwgZXJyb3JzWzBdID8/IFwiZGlkIG5vdCBtYXRjaCBhbnkgYWxsb3dlZCBzY2hlbWFcIilcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbGxPZikpIHtcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBzY2hlbWEuYWxsT2YpIHtcbiAgICAgIGlmICghaXNQbGFpbk9iamVjdChvcHRpb24pKSBjb250aW51ZVxuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKG9wdGlvbiBhcyBKU09OU2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICB9XG4gIH1cblxuICB2YWxpZGF0ZUJ5VHlwZShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICByZXR1cm4gdmFsdWUgYXMgVFxufVxuIiwKICAgICJpbXBvcnQgeyB2YWxpZGF0ZUpzb25TY2hlbWEgfSBmcm9tIFwiLi9qc29uc2NoZW1hXCJcblxuXG5leHBvcnQgdHlwZSBKU09OU2NoZW1hID0geyBba2V5OiBzdHJpbmddOiBKc29uRGF0YSB9XG5cblxuZXhwb3J0IHR5cGUgSnNvbkRhdGEgPSBzdHJpbmcgfCBudWxsIHwgbnVtYmVyIHwgYm9vbGVhbiB8IHsgW2tleSBpbiBzdHJpbmddOiBKc29uRGF0YSB9IHwgSnNvbkRhdGFbXVxuXG5leHBvcnQgdHlwZSBTY2hlbWE8VD4gPSB7IGpzb246IEpTT05TY2hlbWEgfVxuXG5leHBvcnQgdHlwZSBJbmZlcjxTPiA9IFMgZXh0ZW5kcyBTY2hlbWE8aW5mZXIgVD4gPyBUIDogbmV2ZXJcblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlID0gPFQ+IChzY2hlbWE6IFNjaGVtYTxUPiwgZGF0YTp1bmtub3duKSA6IFQgPT4ge1xuICByZXR1cm4gdmFsaWRhdGVKc29uU2NoZW1hPFQ+KHNjaGVtYS5qc29uLCBkYXRhKVxufVxuXG5leHBvcnQgY29uc3Qgc3RyaW5naWZ5ID0gKGRhdGE6IEpzb25EYXRhKTogc3RyaW5nID0+IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpXG5cblxuZXhwb3J0IGNvbnN0IGZpbGxTY2hlbWEgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogVCA9PntcbiAgbGV0IGpzb24gPSBzY2hlbWEuanNvblxuICBpZiAoanNvbi50eXBlID09IFwic3RyaW5nXCIpIHJldHVybiBcIlwiIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm51bWJlclwiKSByZXR1cm4gMCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBmYWxzZSBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudWxsXCIpIHJldHVybiBudWxsIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcImFycmF5XCIpIHJldHVybiBbXSBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBqc29uLnByb3BlcnRpZXMpe1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge31cbiAgICBsZXQgcmVxdWlyZWQgPSBBcnJheS5pc0FycmF5KGpzb24ucmVxdWlyZWQpID8ganNvbi5yZXF1aXJlZCBhcyBzdHJpbmdbXSA6IFtdXG4gICAgZm9yIChsZXQgcmVxIG9mIHJlcXVpcmVkKVxuICAgICAgcmVzdWx0W3JlcV0gPSBmaWxsU2NoZW1hKHtqc29uOiAoanNvbi5wcm9wZXJ0aWVzIGFzIGFueSlbcmVxXX0pXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGlmIChcImNvbnN0XCIgaW4ganNvbikgcmV0dXJuIGpzb24uY29uc3QgYXMgVFxuICBpZiAoXCJhbnlPZlwiIGluIGpzb24gJiYgQXJyYXkuaXNBcnJheShqc29uLmFueU9mKSkgcmV0dXJuIGZpbGxTY2hlbWEoe2pzb246IGpzb24uYW55T2ZbMF0gYXMgSlNPTlNjaGVtYX0pIGFzIFRcbiAgcmV0dXJuIG51bGwgYXMgVFxufVxuXG5leHBvcnQgY29uc3QgZnJvbUpzb25TY2hlbWEgPSA8VD4gKGpzb246IEpTT05TY2hlbWEpOiBTY2hlbWE8VD4gPT4gKHtqc29ufSlcblxuZXhwb3J0IGNvbnN0IHN0cmluZzogU2NoZW1hPHN0cmluZz4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJzdHJpbmdcIn0pXG5leHBvcnQgY29uc3QgbnVtYmVyOiBTY2hlbWE8bnVtYmVyPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm51bWJlclwifSlcbmV4cG9ydCBjb25zdCBib29sZWFuOiBTY2hlbWE8Ym9vbGVhbj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJib29sZWFuXCJ9KVxuZXhwb3J0IGNvbnN0IG51bGxTY2hlbWEgOiBTY2hlbWE8bnVsbD4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudWxsXCJ9KVxuZXhwb3J0IGNvbnN0IGFueTogU2NoZW1hPGFueT4gPSBmcm9tSnNvblNjaGVtYSh7fSlcbmV4cG9ydCBjb25zdCBvcHRpb25hbCA9IDxUPihzY2hlbWE6IFNjaGVtYTxUPikgOiBTY2hlbWE8VCB8IG51bGw+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogW3t0eXBlOiBcIm51bGxcIn0sIHNjaGVtYS5qc29uXX0pXG5leHBvcnQgY29uc3QgYXJyYXkgPSA8VD4oaXRlbVNjaGVtYTogU2NoZW1hPFQ+KTogU2NoZW1hPFRbXT4gPT4gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYXJyYXlcIiwgaXRlbXM6IGl0ZW1TY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3QgY29uc3RhbnQgPSA8VCBleHRlbmRzIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4+KHZhbHVlOiBUKTogU2NoZW1hPFQ+ID0+IGZyb21Kc29uU2NoZW1hKHtjb25zdDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3Qgb2JqZWN0ID0gPFMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBTY2hlbWE8YW55Pj4+IChzaGFwZTogUyk6IFNjaGVtYTx7W0sgaW4ga2V5b2YgU106IEluZmVyPFNbS10+fT4gPT4gZnJvbUpzb25TY2hlbWEoe1xuICB0eXBlOiBcIm9iamVjdFwiLFxuICBwcm9wZXJ0aWVzOiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMoc2hhcGUpLm1hcCgoW2tleSwgZmllbGRdKT0+IFtrZXksIGZpZWxkLmpzb25dKSksXG4gIHJlcXVpcmVkOiBPYmplY3Qua2V5cyhzaGFwZSlcbn0pXG5cbmV4cG9ydCBjb25zdCByZWNvcmQgPSA8VD4odmFsdWVTY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxSZWNvcmQ8c3RyaW5nLCBUPj4gPT4gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwib2JqZWN0XCIsIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiB2YWx1ZVNjaGVtYS5qc29ufSlcbmV4cG9ydCBjb25zdCBzY2hlbWFTY2hlbWEgOiBTY2hlbWE8SlNPTlNjaGVtYT4gPSByZWNvcmQoYW55KVxuXG5leHBvcnQgY29uc3QgdW5pb24gPSA8UyBleHRlbmRzIFNjaGVtYTxhbnk+W10+KC4uLnNjaGVtYXM6IFMpOiBTY2hlbWE8SW5mZXI8U1tudW1iZXJdPj4gPT4gZnJvbUpzb25TY2hlbWEoe2FueU9mOiBzY2hlbWFzLm1hcChzPT4gcy5qc29uKX0pXG5cbmV4cG9ydCBmdW5jdGlvbiB0YWdnZWQgPFMgZXh0ZW5kcyB7W2tleSA6IHN0cmluZ106IFNjaGVtYTxhbnk+fT4gKGZpZWxkczogUykgOiBTY2hlbWE8e1trZXkgaW4ga2V5b2YgU106IHskOiBrZXksIHZhbDpJbmZlcjxTW2tleV0+fSB9W2tleW9mIFNdPiB7XG4gIHJldHVybiB1bmlvbiguLi5PYmplY3QuZW50cmllcyhmaWVsZHMpLm1hcCgoWyQsdmFsXSk9Pm9iamVjdCh7JDpjb25zdGFudCgkKSx2YWx9KSkpXG59XG5cblxuXG5cbmV4cG9ydCBjb25zdCBpbnRlcnNlY3Rpb24gPSA8UyBleHRlbmRzIFNjaGVtYTxhbnk+W10+KC4uLnNjaGVtYXM6IFMpOiBTY2hlbWE8SW5mZXI8U1tudW1iZXJdPj4gPT4gZnJvbUpzb25TY2hlbWEoe2FsbE9mOiBzY2hlbWFzLm1hcChzPT4gcy5qc29uKX0pXG5cbmV4cG9ydCBjb25zdCBhc1R5cGVWaWV3ID0gKHNjaGVtYTogU2NoZW1hPGFueT4pOiBzdHJpbmcgPT4ge1xuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJzdHJpbmdcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bWJlclwiKSByZXR1cm4gXCJudW1iZXJcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcImJvb2xlYW5cIikgcmV0dXJuIFwiYm9vbGVhblwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJhcnJheVwiICYmIHNjaGVtYS5qc29uLml0ZW1zKSByZXR1cm4gYCR7YXNUeXBlVmlldyh7anNvbjogc2NoZW1hLmpzb24uaXRlbXMgYXMgSlNPTlNjaGVtYX0pfVtdYFxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm9iamVjdFwiICYmIHNjaGVtYS5qc29uLnByb3BlcnRpZXMpe1xuICAgIGxldCBwcm9wcyA9IE9iamVjdC5lbnRyaWVzKHNjaGVtYS5qc29uLnByb3BlcnRpZXMpLm1hcCgoW2tleSwgcHJvcF0pPT4gYCR7a2V5fTogJHthc1R5cGVWaWV3KHtqc29uOiBwcm9wIGFzIEpTT05TY2hlbWF9KX1gKVxuICAgIHJldHVybiBge1xcbiAgJHtwcm9wcy5qb2luKFwiLFxcblwiKS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiXFxuICBcIil9XFxufWBcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYS5qc29uKSByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc2NoZW1hLmpzb24uY29uc3QpXG4gIGlmIChcImFueU9mXCIgaW4gc2NoZW1hLmpzb24gJiYgQXJyYXkuaXNBcnJheShzY2hlbWEuanNvbi5hbnlPZikpIHJldHVybiBzY2hlbWEuanNvbi5hbnlPZi5tYXAocz0+IGFzVHlwZVZpZXcoe2pzb246IHMgYXMgSlNPTlNjaGVtYX0pKS5qb2luKFwiIHwgXCIpXG4gIHJldHVybiBcImFueVwiXG59XG5cblxuIiwKICAgICJpbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuL3JvYWRtYXBcIjtcbmltcG9ydCB7IGFycmF5LCBib29sZWFuLCBjb25zdGFudCwgbnVtYmVyLCBvYmplY3QsIHN0cmluZywgdGFnZ2VkLCB1bmlvbiwgdHlwZSBJbmZlciwgdHlwZSBTY2hlbWEgfSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuZXhwb3J0IHR5cGUgVVVJRCA9IGB1JHtzdHJpbmd9LSR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBVVUlEIDogU2NoZW1hPFVVSUQ+ID0gc3RyaW5nXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21VVUlEKCkge3JldHVybiBcInVcIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSArIFwiLVwiICsgcmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIsMTApIGFzIFVVSUR9XG5cblxuZXhwb3J0IGNvbnN0IFJlcXVlc3QgPSBvYmplY3Qoe1xuICBpZDogVVVJRCxcbiAgc3RhcnRQb2ludDogbnVtYmVyLFxuICBlbmRQb2ludDogbnVtYmVyLFxuICB2YWx1ZV9ldXI6IG51bWJlcixcbiAgZGVhZGxpbmVfaDogbnVtYmVyLFxufSlcblxuZXhwb3J0IGNvbnN0IFRyYW5zcG9ydGVyID0gb2JqZWN0KHsgaWQ6IFVVSUQsIHBvc2l0aW9uOiBVVUlELCB9KVxuXG5leHBvcnQgY29uc3QgU2NoZWR1bGVTdGVwID0gdGFnZ2VkKHtcbiAgcGlja3VwOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyLCBkZWNrOiB1bmlvbihjb25zdGFudCgwKSwgY29uc3RhbnQoMSkpfSksXG4gIGRlbGl2ZXI6IG9iamVjdCh7cmVxdWVzdDogVVVJRCwgcG9zOiBudW1iZXJ9KSxcbiAgc3RhcnQ6IG9iamVjdCh7cG9zOiBudW1iZXJ9KSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGVJdGVtID0gb2JqZWN0KHtcbiAgdHJhbnNwb3J0ZXI6IFVVSUQsXG4gIHN0ZXBzOiBhcnJheShTY2hlZHVsZVN0ZXApLFxufSlcbmV4cG9ydCBjb25zdCBTY2hlZHVsZSA9IGFycmF5KFNjaGVkdWxlSXRlbSlcblxuXG5leHBvcnQgdHlwZSBSZXF1ZXN0ID0gSW5mZXI8dHlwZW9mIFJlcXVlc3Q+XG5leHBvcnQgdHlwZSBUcmFuc3BvcnRlciA9IEluZmVyPHR5cGVvZiBUcmFuc3BvcnRlcj5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlU3RlcCA9IEluZmVyPHR5cGVvZiBTY2hlZHVsZVN0ZXA+XG5leHBvcnQgdHlwZSBTY2hlZHVsZUl0ZW0gPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVJdGVtPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGUgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGU+XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbU1vZHVsZSAoXG4gIE5SRVFTID0gMjAwLFxuICBOVFJBTlMgPSA0MCxcbiAgTlBPSU5UUyA9IDEwMCxcbiAgTUFQU0laRSA9IDQwMCxcbiAgc2VlZCA9IDIyLFxuKXtcblxuICBjb25zdCByb2FkbWFwID0gcmFuZG9tTWFwKE5QT0lOVFMsIE1BUFNJWkUpXG5cbiAgcmV0dXJuIHtcbiAgICBOVFJBTlMsXG4gICAgTlJFUVMsXG4gICAgTUFQU0laRSxcbiAgICBSU0laRTogTlBPSU5UUyAqIE5QT0lOVFMgLyAyLFxuICAgIHJvYWRtYXAsXG4gICAgcmVxdWVzdHM6IEFycmF5LmZyb20oe2xlbmd0aDpOUkVRU30sIChfLGkpPT4gKHtcbiAgICAgIGlkOiByYW5kb21VVUlEKCksXG4gICAgICBkZWFkbGluZV9oOiAoMStyYW5kb20oKSkgKiA0MCxcbiAgICAgIHN0YXJ0UG9pbnQ6IHJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSkgYXMgbnVtYmVyLFxuICAgICAgZW5kUG9pbnQ6IHJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSkgYXMgbnVtYmVyLFxuICAgICAgdmFsdWVfZXVyOiByYW5kSW50KDEwMCwgNDAwKSxcbiAgICB9KSBhcyBSZXF1ZXN0KSxcbiAgICBzdGFydHBvc2l0aW9uczogQXJyYXkuZnJvbSh7bGVuZ3RoOk5UUkFOU30sIChfLGkpPT5yYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlciksXG4gIH1cbn1cblxuXG5leHBvcnQgdHlwZSBNb2R1bGUgPSB0eXBlb2YgcmFuZG9tTW9kdWxlIGV4dGVuZHMgKC4uLng6YW55KSA9PiAoaW5mZXIgVCkgPyBUIDogbmV2ZXJcblxuIiwKICAgICJpbXBvcnQgeyB2YWxpZGF0ZSwgdHlwZSBKc29uRGF0YSwgdHlwZSBTY2hlbWEgfSBmcm9tIFwiLi9zY2hlbWFcIlxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rV3JpdGFibGU8VCBleHRlbmRzIEpzb25EYXRhPiAodmFsdWU6IFQpIHtcblxuICBsZXQgbGlzdGVuZXJzOiAoKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZTogVCk9PnZvaWQpW10gPSBbXVxuICBsZXQgcmVwID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpXG5cbiAgbGV0IHJlcyA9IHtcbiAgICBnZXQ6ICgpID0+IHZhbHVlLFxuICAgIHNldDogKG5ld1ZhbHVlOiBUKSA9PiB7XG4gICAgICBsZXQgbmV3UmVwID0gSlNPTi5zdHJpbmdpZnkobmV3VmFsdWUpXG4gICAgICBpZiAobmV3UmVwID09PSByZXApIHJldHVyblxuICAgICAgcmVwID0gbmV3UmVwXG4gICAgICBsaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKG5ld1ZhbHVlLCB2YWx1ZSkpXG4gICAgICB2YWx1ZSA9IG5ld1ZhbHVlXG4gICAgfSxcbiAgICBvbnVwZGF0ZTogKGxpc3RlbmVyOiAobmV3VmFsdWU6IFQsIG9sZFZhbHVlIDpUKT0+dm9pZCwgZGVmZXJyZWQgPSBmYWxzZSkgPT4ge1xuICAgICAgaWYgKCFkZWZlcnJlZCkgbGlzdGVuZXIodmFsdWUsIHZhbHVlKVxuICAgICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpXG4gICAgfSxcbiAgICB1cGRhdGU6IChjYWxsYmFjazogKG9sZFZhbHVlOiBUKT0+VCB8IHVuZGVmaW5lZCkgPT4ge1xuICAgICAgbGV0IG5ld1ZhbHVlID0gY2FsbGJhY2sodmFsdWUpID8/IHZhbHVlXG4gICAgICByZXMuc2V0KG5ld1ZhbHVlKVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIHJlc1xuXG59XG5cbmV4cG9ydCB0eXBlIFdyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gPSBSZXR1cm5UeXBlPHR5cGVvZiBta1dyaXRhYmxlPFQ+PlxuXG5leHBvcnQgZnVuY3Rpb24gbWtTdG9yZWQgPFQgZXh0ZW5kcyBKc29uRGF0YT4gKGtleTogc3RyaW5nLCBzY2hlbWE6IFNjaGVtYTxUPiwgZGVmYXVsdFZhbHVlOiBUKSB7XG4gIGxldCB2YWwgPSBkZWZhdWx0VmFsdWVcbiAgdHJ5e1xuICAgIHZhbCA9IHZhbGlkYXRlKHNjaGVtYSwgSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpISkpXG4gIH1jYXRjaHt9XG5cbiAgbGV0IHJlcyA9IG1rV3JpdGFibGU8VD4odmFsKVxuICBcbiAgcmVzLm9udXBkYXRlKChuZXdWYWx1ZSk9PntcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKSlcbiAgfSlcblxuICByZXR1cm4gcmVzXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5cbmV4cG9ydCBjb25zdCBLTV9DT1NUX0NFTlRTID0gNTA7XG5leHBvcnQgY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuZXhwb3J0IGNvbnN0IFJFT1JHX0NPU1RfQ0VOVFMgPSAxMF8wMDA7XG5leHBvcnQgY29uc3QgSU5GID0gMSA8PCAzMDtcblxuZXhwb3J0IHR5cGUgUGFpckluZm8gPSB7XG4gIHJlcTogbnVtYmVyO1xuICBmaXJzdDogbnVtYmVyO1xuICBzZWNvbmQ6IG51bWJlcjtcbiAgZGVjazogMCB8IDE7XG59O1xuXG5leHBvcnQgdHlwZSBBbm5lYWxpbmdTdGF0ZSA9IHtcbiAgbW9kOiBNb2R1bGU7XG4gIE5SRVFTOiBudW1iZXI7XG4gIE5UUkFOUzogbnVtYmVyO1xuICBUU0laRTogbnVtYmVyO1xuICByZXFQaWNrdXBMb2NhdGlvbnM6IFVpbnQxNkFycmF5O1xuICByZXFEZWxpdmVyeUxvY2F0aW9uczogVWludDE2QXJyYXk7XG4gIHJlcURlYWRsaW5lczogVWludDMyQXJyYXk7XG4gIHJlcVZhbHVlczogVWludDMyQXJyYXk7XG4gIHVuYXNzaWduZWQ6IEludDhBcnJheTtcbiAgdHJhblN0YXJ0OiBVaW50MTZBcnJheTtcbiAgc2NoZWR1bGU6IFVpbnQzMkFycmF5O1xuICBzY2hlZHVsZVNpemVzOiBVaW50MTZBcnJheTtcbiAgc2NoZWR1bGVSYXRpbmdzOiBJbnQzMkFycmF5O1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzTG9hZCh4OiBudW1iZXIpIHtcbiAgcmV0dXJuIHggJiAxO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVjayh4OiBudW1iZXIpIHtcbiAgcmV0dXJuICgoeCAmIDIpID4+IDEpIGFzIDAgfCAxO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVxKHg6IG51bWJlcikge1xuICByZXR1cm4gKHggJiAweGZmZmYpID4+IDI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQb3MoeDogbnVtYmVyKSB7XG4gIHJldHVybiB4ID4+IDE2O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdEFubmVhbGluZ1N0YXRlKG1vZDogTW9kdWxlLCBzZWVkPzogQW5uZWFsaW5nUmVzdWx0KTogQW5uZWFsaW5nU3RhdGUge1xuICBjb25zdCB7IE5SRVFTLCByZXF1ZXN0cywgc3RhcnRwb3NpdGlvbnMsIE5UUkFOUyB9ID0gbW9kO1xuICBjb25zdCBUU0laRSA9IE1hdGguZmxvb3IoTlJFUVMgKiAyLjUgKyAxMCk7XG5cbiAgcmV0dXJuIHtcbiAgICBtb2QsXG4gICAgTlJFUVMsXG4gICAgTlRSQU5TLFxuICAgIFRTSVpFLFxuICAgIHJlcVBpY2t1cExvY2F0aW9uczogbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5zdGFydFBvaW50KSksXG4gICAgcmVxRGVsaXZlcnlMb2NhdGlvbnM6IG5ldyBVaW50MTZBcnJheShyZXF1ZXN0cy5tYXAoKHIpID0+IHIuZW5kUG9pbnQpKSxcbiAgICByZXFEZWFkbGluZXM6IG5ldyBVaW50MzJBcnJheShyZXF1ZXN0cy5tYXAoKHIpID0+IE1hdGguZmxvb3Ioci5kZWFkbGluZV9oICogNjApKSksXG4gICAgcmVxVmFsdWVzOiBuZXcgVWludDMyQXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiBNYXRoLnJvdW5kKHIudmFsdWVfZXVyICogMTAwKSkpLFxuICAgIHVuYXNzaWduZWQ6IHNlZWQgPyBuZXcgSW50OEFycmF5KHNlZWQudW5hc3NpZ25lZCkgOiBuZXcgSW50OEFycmF5KHJlcXVlc3RzLm1hcCgoKSA9PiAxKSksXG4gICAgdHJhblN0YXJ0OiBuZXcgVWludDE2QXJyYXkoc3RhcnRwb3NpdGlvbnMpLFxuICAgIHNjaGVkdWxlOiBzZWVkID8gbmV3IFVpbnQzMkFycmF5KHNlZWQuc2NoZWR1bGUpIDogbmV3IFVpbnQzMkFycmF5KFRTSVpFICogTlRSQU5TKSxcbiAgICBzY2hlZHVsZVNpemVzOiBzZWVkID8gbmV3IFVpbnQxNkFycmF5KHNlZWQuc2NoZWR1bGVTaXplcykgOiBuZXcgVWludDE2QXJyYXkoTlRSQU5TKSxcbiAgICBzY2hlZHVsZVJhdGluZ3M6IHNlZWQgPyBuZXcgSW50MzJBcnJheShzZWVkLnNjaGVkdWxlUmF0aW5ncykgOiBuZXcgSW50MzJBcnJheShOVFJBTlMpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcm91dGVPZmZzZXQoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIpIHtcbiAgcmV0dXJuIHRyYW4gKiBzdGF0ZS5UU0laRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFJlcShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgaWR4OiBudW1iZXIsIGlzTG9hZEJpdDogMSB8IDAsIGRlY2s6IDAgfCAxLCByZXE6IG51bWJlciwgcG9zOiBudW1iZXIpIHtcbiAgc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pICsgaWR4XSA9IChpc0xvYWRCaXQgPDwgMCkgfCAoZGVjayA8PCAxKSB8IChyZXEgPDwgMikgfCAocG9zIDw8IDE2KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNjb3JlUm91dGUoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIpIHtcbiAgbGV0IHJld2FyZCA9IDA7XG4gIGxldCBjb3N0ID0gMDtcbiAgbGV0IGVsYXBzZWRNaW51dGVzID0gMDtcbiAgY29uc3QgZGVja3M6IFtudW1iZXJbXSwgbnVtYmVyW11dID0gW1tdLCBbXV07XG4gIGxldCBwb3MgPSBzdGF0ZS50cmFuU3RhcnRbdHJhbl0hO1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKTtcbiAgICBjb25zdCBuZXh0UG9zID0gZ2V0UG9zKHN0ZXApO1xuICAgIGNvbnN0IGRpc3RhbmNlID0gc3RhdGUubW9kLnJvYWRtYXAuZ2V0Q29zdE4ocG9zLCBuZXh0UG9zKTtcbiAgICBjb3N0ICs9IGRpc3RhbmNlICogS01fQ09TVF9DRU5UUztcbiAgICBlbGFwc2VkTWludXRlcyArPSBkaXN0YW5jZSAqIDYwIC8gQVZHX1NQRUVEX0tNSDtcbiAgICBwb3MgPSBuZXh0UG9zO1xuXG4gICAgaWYgKGxvYWQpIHtcbiAgICAgIGNvbnN0IGRlY2sgPSBkZWNrc1tnZXREZWNrKHN0ZXApXSE7XG4gICAgICBkZWNrLnB1c2gocmVxKTtcbiAgICAgIGlmIChkZWNrLmxlbmd0aCA+IDMpIHJldHVybiAtSU5GO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgY29uc3QgaWR4ID0gZGVjay5pbmRleE9mKHJlcSk7XG4gICAgICBpZiAoaWR4ID09PSAtMSkgcmV0dXJuIC1JTkY7XG4gICAgICBjb3N0ICs9IChkZWNrLmxlbmd0aCAtIGlkeCAtIDEpICogUkVPUkdfQ09TVF9DRU5UUztcbiAgICAgIGRlY2suc3BsaWNlKGlkeCwgMSk7XG4gICAgICBpZiAoZWxhcHNlZE1pbnV0ZXMgPD0gc3RhdGUucmVxRGVhZGxpbmVzW3JlcV0hKSByZXdhcmQgKz0gc3RhdGUucmVxVmFsdWVzW3JlcV0hO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXdhcmQgLSBjb3N0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaEFsbFJhdGluZ3Moc3RhdGU6IEFubmVhbGluZ1N0YXRlKSB7XG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBzdGF0ZS5zY2hlZHVsZVJhdGluZ3NbdHJhbl0gPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBtYXhMb3NzID0gMTJfMDAwKSB7XG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBpZiAoc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSAhPT0gMCkgY29udGludWU7XG5cbiAgICBsZXQgYmVzdFJlcSA9IC0xO1xuICAgIGxldCBiZXN0U2NvcmUgPSAtSU5GO1xuXG4gICAgZm9yIChsZXQgcmVxID0gMDsgcmVxIDwgc3RhdGUuTlJFUVM7IHJlcSsrKSB7XG4gICAgICBpZiAoIXN0YXRlLnVuYXNzaWduZWRbcmVxXSkgY29udGludWU7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgMCwgMCwgMCwgcmVxKTtcbiAgICAgIGNvbnN0IHNjb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgMCwgMSk7XG4gICAgICBpZiAoc2NvcmUgPiBiZXN0U2NvcmUpIHtcbiAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgIGJlc3RSZXEgPSByZXE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RSZXEgPT09IC0xIHx8IGJlc3RTY29yZSA8IC1tYXhMb3NzKSBjb250aW51ZTtcblxuICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCAwLCAwLCAwLCBiZXN0UmVxKTtcbiAgICBzdGF0ZS5zY2hlZHVsZVJhdGluZ3NbdHJhbl0gPSBiZXN0U2NvcmU7XG4gICAgc3RhdGUudW5hc3NpZ25lZFtiZXN0UmVxXSA9IDA7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFN0b3BzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlciwgZGVjazogMCB8IDEsIHJlcTogbnVtYmVyKSB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dID0gc2l6ZSArIDI7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kICsgMiwgb2Zmc2V0ICsgZW5kLCBvZmZzZXQgKyBzaXplKTtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBzdGFydCArIDEsIG9mZnNldCArIHN0YXJ0LCBvZmZzZXQgKyBlbmQgKyAxKTtcbiAgc2V0UmVxKHN0YXRlLCB0cmFuLCBzdGFydCwgMSwgZGVjaywgcmVxLCBzdGF0ZS5yZXFQaWNrdXBMb2NhdGlvbnNbcmVxXSEpO1xuICBzZXRSZXEoc3RhdGUsIHRyYW4sIGVuZCArIDEsIDAsIGRlY2ssIHJlcSwgc3RhdGUucmVxRGVsaXZlcnlMb2NhdGlvbnNbcmVxXSEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlU3RvcHMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dID0gc2l6ZSAtIDI7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgZW5kKTtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBlbmQgLSAxLCBvZmZzZXQgKyBlbmQgKyAxLCBvZmZzZXQgKyBzaXplKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRQYWlySW5Sb3V0ZShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgcmVxOiBudW1iZXIpOiBQYWlySW5mbyB8IG51bGwge1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG4gIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgbGV0IGZpcnN0ID0gLTE7XG4gIGxldCBzZWNvbmQgPSAtMTtcbiAgbGV0IGRlY2s6IDAgfCAxID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgIGNvbnN0IHN0ZXAgPSBzdGF0ZS5zY2hlZHVsZVtvZmZzZXQgKyBpXSE7XG4gICAgaWYgKGdldFJlcShzdGVwKSAhPT0gcmVxKSBjb250aW51ZTtcbiAgICBpZiAoZmlyc3QgPT09IC0xKSB7XG4gICAgICBmaXJzdCA9IGk7XG4gICAgICBkZWNrID0gZ2V0RGVjayhzdGVwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2Vjb25kID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChmaXJzdCA9PT0gLTEgfHwgc2Vjb25kID09PSAtMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IHJlcSwgZmlyc3QsIHNlY29uZCwgZGVjayB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlVW5hc3NpZ25lZFJlcShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heEF0dGVtcHRzID0gMjQpOiBudW1iZXIgfCBudWxsIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhBdHRlbXB0czsgaSsrKSB7XG4gICAgY29uc3QgcmVxID0gcmFuZEludCgwLCBzdGF0ZS5OUkVRUyk7XG4gICAgaWYgKHN0YXRlLnVuYXNzaWduZWRbcmVxXSkgcmV0dXJuIHJlcTtcbiAgfVxuXG4gIGZvciAobGV0IHJlcSA9IDA7IHJlcSA8IHN0YXRlLk5SRVFTOyByZXErKykge1xuICAgIGlmIChzdGF0ZS51bmFzc2lnbmVkW3JlcV0pIHJldHVybiByZXE7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhbXBsZUFzc2lnbmVkUGFpcihzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heEF0dGVtcHRzID0gMjQpOiB7IHRyYW46IG51bWJlcjsgcGFpcjogUGFpckluZm8gfSB8IG51bGwge1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IG1heEF0dGVtcHRzOyBhdHRlbXB0KyspIHtcbiAgICBjb25zdCB0cmFuID0gcmFuZEludCgwLCBzdGF0ZS5OVFJBTlMpO1xuICAgIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2l6ZSA8IDIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2l6ZSk7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKHN0YXRlLnNjaGVkdWxlW3JvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKSArIGlkeF0hKTtcbiAgICBjb25zdCBwYWlyID0gZmluZFBhaXJJblJvdXRlKHN0YXRlLCB0cmFuLCByZXEpO1xuICAgIGlmIChwYWlyKSByZXR1cm4geyB0cmFuLCBwYWlyIH07XG4gIH1cblxuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHN0YXRlLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGlmIChzaXplIDwgMikgY29udGludWU7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKHN0YXRlLnNjaGVkdWxlW3JvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKV0hKTtcbiAgICBjb25zdCBwYWlyID0gZmluZFBhaXJJblJvdXRlKHN0YXRlLCB0cmFuLCByZXEpO1xuICAgIGlmIChwYWlyKSByZXR1cm4geyB0cmFuLCBwYWlyIH07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFjY2VwdEFubmVhbChwcmV2U2NvcmU6IG51bWJlciwgbmV4dFNjb3JlOiBudW1iZXIsIHRlbXA6IG51bWJlcikge1xuICBpZiAobmV4dFNjb3JlID49IHByZXZTY29yZSkgcmV0dXJuIHRydWU7XG4gIGNvbnN0IGRlbHRhID0gcHJldlNjb3JlIC0gbmV4dFNjb3JlO1xuICByZXR1cm4gcmFuZG9tKCkgPCBNYXRoLmV4cCgtZGVsdGEgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9Bbm5lYWxpbmdSZXN1bHQoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBlbGFwc2VkTXM6IG51bWJlcik6IEFubmVhbGluZ1Jlc3VsdCB7XG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGU6IHN0YXRlLnNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHN0YXRlLnNjaGVkdWxlU2l6ZXMsXG4gICAgdHJhblN0YXJ0OiBzdGF0ZS50cmFuU3RhcnQsXG4gICAgVFNJWkU6IHN0YXRlLlRTSVpFLFxuICAgIHNjaGVkdWxlUmF0aW5nczogc3RhdGUuc2NoZWR1bGVSYXRpbmdzLFxuICAgIHVuYXNzaWduZWQ6IHN0YXRlLnVuYXNzaWduZWQsXG4gICAgZWxhcHNlZE1zLFxuICAgIHRvdGFsU2NvcmU6IHN0YXRlLnNjaGVkdWxlUmF0aW5ncy5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSxcbiAgfTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7XG4gIGJvb3RzdHJhcEVtcHR5Um91dGVzLFxuICBnZXREZWNrLFxuICBnZXRSZXEsXG4gIGluaXRBbm5lYWxpbmdTdGF0ZSxcbiAgaW5zZXJ0U3RvcHMsXG4gIHJlbW92ZVN0b3BzLFxuICBzY29yZVJvdXRlLFxuICB0b0FubmVhbGluZ1Jlc3VsdCxcbn0gZnJvbSBcIi4vYW5uZWFsaW5nX3NoYXJlZFwiO1xuXG5leHBvcnQgdHlwZSBBbm5lYWxpbmdSZXN1bHQgPSB7XG4gIHNjaGVkdWxlOiBVaW50MzJBcnJheTtcbiAgc2NoZWR1bGVTaXplczogVWludDE2QXJyYXk7XG4gIHRyYW5TdGFydDogVWludDE2QXJyYXk7XG4gIFRTSVpFOiBudW1iZXI7XG4gIHNjaGVkdWxlUmF0aW5nczogSW50MzJBcnJheTtcbiAgdW5hc3NpZ25lZDogSW50OEFycmF5O1xuICBlbGFwc2VkTXM6IG51bWJlcjtcbiAgdG90YWxTY29yZTogbnVtYmVyO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2VsaW5lQW5uZWFsaW5nKG1vZDogTW9kdWxlLCBzdGVwcyA9IDFfNjAwXzAwMCk6IEFubmVhbGluZ1Jlc3VsdCB7XG4gIGNvbnN0IHN0YXRlID0gaW5pdEFubmVhbGluZ1N0YXRlKG1vZCk7XG4gIGNvbnN0IHsgTlJFUVMsIE5UUkFOUywgVFNJWkUsIHNjaGVkdWxlLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuXG4gIGxldCBzdGFydFRlbXAgPSA1XzAwMDtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2UmF0aW5nOiBudW1iZXIsIG5leHRSYXRpbmc6IG51bWJlcikge1xuICAgIGlmIChuZXh0UmF0aW5nID49IHByZXZSYXRpbmcpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0UmF0aW5nIC0gcHJldlJhdGluZykgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2NoZWRTaXplICsgMSk7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKHNjaGVkU2l6ZSwgcmFuZEludCgwLCA0KSArIGEpO1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpO1xuICAgIGlmICghdW5hc3NpZ25lZFtyZXFdKSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcmFuZG9tKCkgPiAwLjUgPyAxIDogMCwgcmVxKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICBjb25zdCBzY2hlZFNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2NoZWRTaXplIDwgMikgcmV0dXJuO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2NoZWRTaXplKTtcbiAgICBjb25zdCBpdGVtID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSE7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKGl0ZW0pO1xuXG4gICAgY29uc3QgYWI6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZFNpemU7IGkrKykge1xuICAgICAgaWYgKGdldFJlcShzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSEpID09PSByZXEpIGFiLnB1c2goaSk7XG4gICAgfVxuICAgIGlmIChhYi5sZW5ndGggIT09IDIpIHJldHVybjtcblxuICAgIGNvbnN0IFthLCBiXSA9IGFiIGFzIFtudW1iZXIsIG51bWJlcl07XG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIpO1xuICAgIGNvbnN0IG5ld1JhdGluZyA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgIGlmIChhY2NlcHQoc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgbmV3UmF0aW5nKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gbmV3UmF0aW5nO1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgLSAxLCBnZXREZWNrKGl0ZW0pIGFzIDAgfCAxLCByZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrKSB7XG4gICAgdGVtcCA9ICgxIC0gaSAvIHN0ZXBzKSAqIHN0YXJ0VGVtcDtcbiAgICB0cnlVbmFzc2lnbigpO1xuICAgIHRyeUFzc2lnbigpO1xuICB9XG5cbiAgcmV0dXJuIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlLCBEYXRlLm5vdygpIC0gc3RhcnRlZEF0KTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZyB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHtcbiAgYWNjZXB0QW5uZWFsLFxuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgdHlwZSBQYWlySW5mbyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNhbXBsZUFzc2lnbmVkUGFpcixcbiAgc2FtcGxlVW5hc3NpZ25lZFJlcSxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxudHlwZSBJbXByb3ZlZE9wdGlvbnMgPVxuICB8IHsgc3RlcHM6IG51bWJlcjsgYnVkZ2V0TXM/OiBuZXZlciB9XG4gIHwgeyBidWRnZXRNczogbnVtYmVyOyBzdGVwcz86IG5ldmVyIH07XG5cbmV4cG9ydCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiA9IHtcbiAgaXRlcmF0ZVN0ZXBzOiAoc3RlcHM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBpdGVyYXRlRm9yTXM6IChidWRnZXRNczogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG4gIGdldFJlc3VsdDogKCkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICByZWhlYXQ6IChmYWN0b3I/OiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kOiBNb2R1bGUsIHRhcmdldFN0ZXBzID0gMTUwMDAwKTogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHtcbiAgY29uc3Qgd2FybXVwU3RlcHMgPSBNYXRoLm1pbihNYXRoLm1heCgyMDAwMCwgTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMikpLCA1MDAwMCk7XG4gIGNvbnN0IHdhcm11cCA9IGJhc2VsaW5lQW5uZWFsaW5nKG1vZCwgd2FybXVwU3RlcHMpO1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QsIHdhcm11cCk7XG4gIGNvbnN0IHsgTlRSQU5TLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuICBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZSk7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDZfMDAwO1xuICBsZXQgZW5kVGVtcCA9IDI1O1xuICBsZXQgdGVtcCA9IHN0YXJ0VGVtcDtcblxuICBmdW5jdGlvbiB0cnlBc3NpZ25TYW1wbGVkKHNhbXBsZXMgPSA4KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7IHRyYW46IG51bWJlcjsgcmVxOiBudW1iZXI7IGE6IG51bWJlcjsgYjogbnVtYmVyOyBkZWNrOiAwIHwgMTsgc2NvcmU6IG51bWJlciB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCByZXEgPSBzYW1wbGVVbmFzc2lnbmVkUmVxKHN0YXRlKTtcbiAgICAgIGlmIChyZXEgPT0gbnVsbCkgYnJlYWs7XG5cbiAgICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgICBjb25zdCBzaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBzaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oc2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgc2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgY29uc3QgZGVjayA9IChyYW5kb20oKSA+IDAuNSA/IDEgOiAwKSBhcyAwIHwgMTtcblxuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIsIGRlY2ssIHJlcSk7XG4gICAgICBjb25zdCBuZXdTY29yZSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgKyAxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IG5ld1Njb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0geyB0cmFuLCByZXEsIGEsIGIsIGRlY2ssIHNjb3JlOiBuZXdTY29yZSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5hLCBiZXN0LmIsIGJlc3QuZGVjaywgYmVzdC5yZXEpO1xuICAgIGlmIChhY2NlcHRBbm5lYWwoc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0hLCBiZXN0LnNjb3JlLCB0ZW1wKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0gPSBiZXN0LnNjb3JlO1xuICAgICAgdW5hc3NpZ25lZFtiZXN0LnJlcV0gPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LmEsIGJlc3QuYiArIDEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVVuYXNzaWduU2FtcGxlZChzYW1wbGVzID0gNikge1xuICAgIGxldCBiZXN0OiBudWxsIHwgeyB0cmFuOiBudW1iZXI7IHBhaXI6IFBhaXJJbmZvOyBzY29yZTogbnVtYmVyIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IGNob3NlbiA9IHNhbXBsZUFzc2lnbmVkUGFpcihzdGF0ZSk7XG4gICAgICBpZiAoIWNob3NlbikgYnJlYWs7XG4gICAgICBjb25zdCB7IHRyYW4sIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG4gICAgICBjb25zdCBuZXdTY29yZSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBuZXdTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHsgdHJhbiwgcGFpciwgc2NvcmU6IG5ld1Njb3JlIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQpO1xuICAgIGlmIChhY2NlcHRBbm5lYWwoc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0hLCBiZXN0LnNjb3JlLCB0ZW1wKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0gPSBiZXN0LnNjb3JlO1xuICAgICAgdW5hc3NpZ25lZFtiZXN0LnBhaXIucmVxXSA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlSZWxvY2F0ZVNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHtcbiAgICAgIHNyYzogbnVtYmVyO1xuICAgICAgZHN0OiBudW1iZXI7XG4gICAgICBwYWlyOiBQYWlySW5mbztcbiAgICAgIGluc2VydEE6IG51bWJlcjtcbiAgICAgIGluc2VydEI6IG51bWJlcjtcbiAgICAgIHNjb3JlOiBudW1iZXI7XG4gICAgICBvbGRTY29yZTogbnVtYmVyO1xuICAgIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IGNob3NlbiA9IHNhbXBsZUFzc2lnbmVkUGFpcihzdGF0ZSk7XG4gICAgICBpZiAoIWNob3NlbikgYnJlYWs7XG5cbiAgICAgIGNvbnN0IHsgdHJhbjogc3JjLCBwYWlyIH0gPSBjaG9zZW47XG4gICAgICBjb25zdCBkc3QgPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgICBjb25zdCBvbGRTY29yZSA9IHNyYyA9PT0gZHN0XG4gICAgICAgID8gc2NoZWR1bGVSYXRpbmdzW3NyY10hXG4gICAgICAgIDogc2NoZWR1bGVSYXRpbmdzW3NyY10hICsgc2NoZWR1bGVSYXRpbmdzW2RzdF0hO1xuXG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgc3JjLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG5cbiAgICAgIGNvbnN0IGRzdFNpemUgPSBzY2hlZHVsZVNpemVzW2RzdF0hO1xuICAgICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgZHN0U2l6ZSArIDEpO1xuICAgICAgY29uc3QgYiA9IE1hdGgubWluKGRzdFNpemUsIGEgKyByYW5kSW50KDAsIE1hdGgubWluKDYsIGRzdFNpemUgLSBhICsgMSkpKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBkc3QsIGEsIGIsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBjb25zdCBjYW5kaWRhdGVTY29yZSA9IHNyYyA9PT0gZHN0XG4gICAgICAgID8gc2NvcmVSb3V0ZShzdGF0ZSwgc3JjKVxuICAgICAgICA6IHNjb3JlUm91dGUoc3RhdGUsIHNyYykgKyBzY29yZVJvdXRlKHN0YXRlLCBkc3QpO1xuXG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgZHN0LCBhLCBiICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgc3JjLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCAtIDEsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgY2FuZGlkYXRlU2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7XG4gICAgICAgICAgc3JjLFxuICAgICAgICAgIGRzdCxcbiAgICAgICAgICBwYWlyLFxuICAgICAgICAgIGluc2VydEE6IGEsXG4gICAgICAgICAgaW5zZXJ0QjogYixcbiAgICAgICAgICBzY29yZTogY2FuZGlkYXRlU2NvcmUsXG4gICAgICAgICAgb2xkU2NvcmUsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC5zcmMsIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QuZHN0LCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuXG4gICAgaWYgKGFjY2VwdEFubmVhbChiZXN0Lm9sZFNjb3JlLCBiZXN0LnNjb3JlLCB0ZW1wKSkge1xuICAgICAgaWYgKGJlc3Quc3JjID09PSBiZXN0LmRzdCkge1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5zcmNdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5zcmMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3Quc3JjXSA9IHNjb3JlUm91dGUoc3RhdGUsIGJlc3Quc3JjKTtcbiAgICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3QuZHN0XSA9IHNjb3JlUm91dGUoc3RhdGUsIGJlc3QuZHN0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QuZHN0LCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiArIDEpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3Quc3JjLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5UmVpbnNlcnRTYW1wbGVkKHNhbXBsZXMgPSA4KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7XG4gICAgICB0cmFuOiBudW1iZXI7XG4gICAgICBwYWlyOiBQYWlySW5mbztcbiAgICAgIGluc2VydEE6IG51bWJlcjtcbiAgICAgIGluc2VydEI6IG51bWJlcjtcbiAgICAgIHNjb3JlOiBudW1iZXI7XG4gICAgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcblxuICAgICAgY29uc3QgeyB0cmFuLCBwYWlyIH0gPSBjaG9zZW47XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQpO1xuXG4gICAgICBjb25zdCBzaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBzaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oc2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgc2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBjb25zdCBjYW5kaWRhdGVTY29yZSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuXG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBjYW5kaWRhdGVTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICB0cmFuLFxuICAgICAgICAgIHBhaXIsXG4gICAgICAgICAgaW5zZXJ0QTogYSxcbiAgICAgICAgICBpbnNlcnRCOiBiLFxuICAgICAgICAgIHNjb3JlOiBjYW5kaWRhdGVTY29yZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcblxuICAgIGlmIChhY2NlcHRBbm5lYWwoc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0hLCBiZXN0LnNjb3JlLCB0ZW1wKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3QudHJhbl0gPSBiZXN0LnNjb3JlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiArIDEpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHNlc3Npb25TdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICBsZXQgaSA9IDA7XG4gIGNvbnN0IHRlbXBGbG9vciA9IDE1MDtcbiAgY29uc3QgcmVoZWF0VGVtcCA9IDJfMjUwO1xuXG4gIGZ1bmN0aW9uIHJ1bkl0ZXJhdGlvbnMoaXRlcmF0aW9uQnVkZ2V0OiBudW1iZXIsIGRlYWRsaW5lID0gSW5maW5pdHkpIHtcbiAgICBjb25zdCBlbmRJdGVyYXRpb24gPSBNYXRoLm1pbih0YXJnZXRTdGVwcywgaSArIGl0ZXJhdGlvbkJ1ZGdldCk7XG4gICAgd2hpbGUgKGkgPCBlbmRJdGVyYXRpb24pIHtcbiAgICAgIGlmICgoaSAmIDIwNDcpID09PSAwICYmIERhdGUubm93KCkgPj0gZGVhZGxpbmUpIGJyZWFrO1xuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBpIC8gdGFyZ2V0U3RlcHM7XG4gICAgICB0ZW1wID0gc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgcHJvZ3Jlc3MpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBydW5UaW1lZENodW5rKGJ1ZGdldE1zOiBudW1iZXIpIHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBidWRnZXRNcztcblxuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXBGbG9vciwgc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgTWF0aC5taW4oMSwgcHJvZ3Jlc3MpKSk7XG5cbiAgICAgIGNvbnN0IHIgPSByYW5kb20oKTtcbiAgICAgIGlmIChyIDwgMC40KSB0cnlBc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC41NSkgdHJ5VW5hc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC44NSkgdHJ5UmVpbnNlcnRTYW1wbGVkKCk7XG4gICAgICBlbHNlIHRyeVJlbG9jYXRlU2FtcGxlZCgpO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVzdWx0KCkge1xuICAgIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgd2FybXVwLmVsYXBzZWRNcyArIChEYXRlLm5vdygpIC0gc2Vzc2lvblN0YXJ0ZWRBdCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpdGVyYXRlU3RlcHMoc3RlcHMpIHtcbiAgICAgIHJ1bkl0ZXJhdGlvbnMoc3RlcHMpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gICAgaXRlcmF0ZUZvck1zKGJ1ZGdldE1zKSB7XG4gICAgICBydW5UaW1lZENodW5rKGJ1ZGdldE1zKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGdldFJlc3VsdCxcbiAgICByZWhlYXQoZmFjdG9yID0gMSkge1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXAsIHJlaGVhdFRlbXAgKiBmYWN0b3IpO1xuICAgICAgLy8gUHVsbCB0aGUgc2VhcmNoIHNsaWdodGx5IGJhY2sgZnJvbSB0aGUgY29sZCBlbmQgb2YgdGhlIHNjaGVkdWxlLlxuICAgICAgaSA9IE1hdGgubWF4KDAsIGkgLSBNYXRoLmZsb29yKHRhcmdldFN0ZXBzICogMC4wOCAqIGZhY3RvcikpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2Q6IE1vZHVsZSwgb3B0aW9uczogSW1wcm92ZWRPcHRpb25zKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3QgdGFyZ2V0U3RlcHMgPSBvcHRpb25zLnN0ZXBzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLnN0ZXBzIDogTWF0aC5tYXgoMTUwMDAwLCBNYXRoLmZsb29yKG9wdGlvbnMuYnVkZ2V0TXMgKiAxOTApKTtcbiAgY29uc3Qgc2Vzc2lvbiA9IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbihtb2QsIHRhcmdldFN0ZXBzKTtcbiAgaWYgKG9wdGlvbnMuc3RlcHMgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZVN0ZXBzKG9wdGlvbnMuc3RlcHMpO1xuICByZXR1cm4gc2Vzc2lvbi5pdGVyYXRlRm9yTXMob3B0aW9ucy5idWRnZXRNcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZyhtb2Q6IE1vZHVsZSwgc3RlcHMgPSAxNTAwMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4gaW1wcm92ZWRBbm5lYWxpbmdDb3JlKG1vZCwgeyBzdGVwcyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nVGltZWQobW9kOiBNb2R1bGUsIGJ1ZGdldE1zID0gMTAwMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4gaW1wcm92ZWRBbm5lYWxpbmdDb3JlKG1vZCwgeyBidWRnZXRNcyB9KTtcbn1cbiIsCiAgICAiXG5leHBvcnQgdHlwZSBOdW1UeXBlID0gXCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIlxuZXhwb3J0IHR5cGUgUmVzdWx0VHlwZSA9IE51bVR5cGUgfCBcInZvaWRcIiB8IFN0cnVjdFR5cGU8YW55PlxuZXhwb3J0IHR5cGUgSW50VHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiXG5leHBvcnQgdHlwZSBQYWNrZWRUeXBlID0gXCJpOFwiIHwgXCJ1OFwiIHwgXCJpMTZcIiB8IFwidTE2XCJcbmV4cG9ydCB0eXBlIE1lbW9yeVR5cGUgPSBOdW1UeXBlIHwgUGFja2VkVHlwZVxuZXhwb3J0IHR5cGUgRFR5cGUgPSBNZW1vcnlUeXBlIHwgU3RydWN0VHlwZTxhbnk+XG5leHBvcnQgdHlwZSBMb2FkZWRUeXBlPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPiA9IFQgZXh0ZW5kcyBQYWNrZWRUeXBlID8gXCJpMzJcIiA6IFRcbmV4cG9ydCB0eXBlIEFyaXRobWV0aWNPcCA9IFwiYWRkXCIgfCBcInN1YlwiIHwgXCJtdWxcIiB8IFwiZGl2XCJcbmV4cG9ydCB0eXBlIEJpdE9wID0gXCJ4b3JcIiB8IFwic2hsXCIgfCBcInNoclwiIHwgXCJhbmRcIiB8IFwib3JcIlxuZXhwb3J0IHR5cGUgUmVtYWluZGVyT3AgPSBcIm1vZFwiIHwgXCJ1bW9kXCJcbmV4cG9ydCB0eXBlIEJpbk9wID0gQXJpdGhtZXRpY09wIHwgQml0T3AgfCBSZW1haW5kZXJPcFxuZXhwb3J0IHR5cGUgQ21wT3AgPSBcImVxXCIgfCBcImx0XCIgfCBcImd0XCJcbmNvbnN0IGFyaXRobWV0aWNPcHMgPSBbXCJhZGRcIiwgXCJzdWJcIiwgXCJtdWxcIiwgXCJkaXZcIl0gYXMgY29uc3RcbmNvbnN0IGJpdE9wcyA9IFtcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwic2hyXCJdIGFzIGNvbnN0XG5jb25zdCByZW1haW5kZXJPcHMgPSBbXCJtb2RcIiwgXCJ1bW9kXCJdIGFzIGNvbnN0XG5jb25zdCBjbXBPcHMgPSBbXCJlcVwiLCBcImx0XCIsIFwiZ3RcIl0gYXMgY29uc3RcbmV4cG9ydCB0eXBlIFZhbHVlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IFQgZXh0ZW5kcyBcImk2NFwiID8gYmlnaW50IDogbnVtYmVyXG5leHBvcnQgdHlwZSBUeXBlZEFycmF5Rm9yPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPiA9XG4gIFQgZXh0ZW5kcyBcImk4XCIgPyBJbnQ4QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJ1MTZcIiA/IFVpbnQxNkFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTE2XCIgPyBJbnQxNkFycmF5IDpcbiAgVCBleHRlbmRzIFwidThcIiA/IFVpbnQ4QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpMzJcIiA/IEludDMyQXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpNjRcIiA/IEJpZ0ludDY0QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJmMzJcIiA/IEZsb2F0MzJBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImY2NFwiID8gRmxvYXQ2NEFycmF5IDogbmV2ZXJcblxudHlwZSBBcmdzRXhwcjxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxBcmdzW0tdPjogbmV2ZXIgfVxudHlwZSBBcmdzTGlrZTxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwckxpa2U8QXJnc1tLXT46IG5ldmVyIH1cbmV4cG9ydCB0eXBlIEFyZ3NWYWw8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gID0geyBbSyBpbiBrZXlvZiBBcmdzXTogQXJnc1tLXSBleHRlbmRzIE51bVR5cGUgPyBWYWx1ZTxBcmdzW0tdPiA6IG5ldmVyIH1cbnR5cGUgRm5SZXR1cm48UiBleHRlbmRzIFJlc3VsdFR5cGU+ID1cbiAgUiBleHRlbmRzIE51bVR5cGUgPyBFeHByPFI+IHwgdm9pZCA6XG4gIFIgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gU3RydWN0VmFsdWU8Rj4gfCB2b2lkIDpcbiAgdm9pZFxuXG50eXBlIExvY2FsTm9kZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGU6IFQsIGxvY2FsOiBudW1iZXIgfVxudHlwZSBHbG9iYWxOb2RlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsga2luZDogXCJnbG9iYWwuZ2V0XCIsIHR5cGU6IFQsIGluaXRpYWw6IFZhbHVlPFQ+IH1cbmV4cG9ydCB0eXBlIENvcmVFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9XG4gIHwgeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFQsIHZhbHVlOiBWYWx1ZTxUPiB9XG4gIHwgTG9jYWxOb2RlPFQ+XG4gIHwgR2xvYmFsTm9kZTxUPlxuICB8IHsga2luZDogXCJiaW5cIiwgdHlwZTogVCwgb3A6IEJpbk9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImNhbGxcIiwgdHlwZTogVCwgdGFyZ2V0OiBBbnlGdW5jLCBhcmdzOiBFeHByPE51bVR5cGU+W10gfVxuICB8IHsga2luZDogXCJjYXN0XCIsIHR5cGU6IFQsIGlucHV0VHlwZTogTnVtVHlwZSwgdW5zaWduZWQ6IGJvb2xlYW4sIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiaWZcIiwgdHlwZTogVCwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZTogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImxvYWRcIiwgdHlwZTogVCwgYXJyYXk6IEFueUFycmF5LCBpbmRleDogRXhwcjxcImkzMlwiPiwgc3RvcmFnZTogTWVtb3J5VHlwZSwgc3RyaWRlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyIH1cbiAgfCAoVCBleHRlbmRzIFwiaTMyXCIgPyB7IGtpbmQ6IFwiY21wXCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogTnVtVHlwZSwgb3A6IENtcE9wLCBsZWZ0OiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwcjxOdW1UeXBlPiB9IDogbmV2ZXIpXG5cbmNsYXNzIEV4cHJNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiB7fVxudHlwZSBBcml0aG1ldGljTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBBcml0aG1ldGljT3BdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbnR5cGUgQ29tcGFyZU1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+ID0geyBbT3AgaW4gQ21wT3BdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFwiaTMyXCI+IH1cbnR5cGUgSW50ZWdlck1ldGhvZHM8VCBleHRlbmRzIEludFR5cGU+ID0geyBbT3AgaW4gQml0T3AgfCBSZW1haW5kZXJPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuZXhwb3J0IHR5cGUgRXhwcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSBDb3JlRXhwcjxUPiAmIEV4cHJNZXRob2RzPFQ+ICYgQXJpdGhtZXRpY01ldGhvZHM8VD4gJiBDb21wYXJlTWV0aG9kczxUPiAmIChUIGV4dGVuZHMgSW50VHlwZSA/IEludGVnZXJNZXRob2RzPFQ+IDoge30pXG5leHBvcnQgdHlwZSBBbnlFeHByID0gYW55XG5cblxuZXhwb3J0IHR5cGUgU3RtdCA9XG4gIHwgeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbDogbnVtYmVyLCB0eXBlOiBOdW1UeXBlLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImdsb2JhbC5zZXRcIiwgZ2xvYmFsOiBBbnlHbG9iYWwsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXk6IEFueUFycmF5LCB0eXBlOiBNZW1vcnlUeXBlLCBpbmRleDogRXhwcjxcImkzMlwiPiwgc3RyaWRlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImFycmF5Lm1vdmVcIiwgYXJyYXk6IEFueUFycmF5LCB0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4gfVxuICB8IHsga2luZDogXCJpZlwiLCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10W10sIGVsc2U6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImxvb3BcIiwgY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwiZm9yXCIsIGxvY2FsOiBudW1iZXIsIHN0YXJ0OiBFeHByPFwiaTMyXCI+LCBlbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcInJldHVyblwiLCB2YWx1ZT86IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJjYWxsLnZvaWRcIiwgdGFyZ2V0OiBBbnlGdW5jLCBhcmdzOiBFeHByPE51bVR5cGU+W10gfVxuICB8IHsga2luZDogXCJ0cmFwXCIsIG1lc3NhZ2U6IHN0cmluZyB9XG4gIHwgeyBraW5kOiBcImxvZ1wiLCBtZXNzYWdlOiBzdHJpbmcsIHZhbHVlOiBFeHByPFwiaTMyXCI+IH1cblxuY2xhc3MgTXV0YWJsZU1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IGV4dGVuZHMgRXhwck1ldGhvZHM8VD4ge1xuICBkZWNsYXJlIHR5cGU6IFRcbiAgZGVjbGFyZSB3cml0ZTogKHZhbHVlOiBFeHByPFQ+KSA9PiBTdG10IHwgdm9pZFxuICBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KTogdm9pZCB7XG4gICAgY29uc3Qgc3RhdGVtZW50ID0gdGhpcy53cml0ZShsaXQodGhpcy50eXBlLCB2YWx1ZSkpXG4gICAgaWYgKHN0YXRlbWVudCkgZW1pdChzdGF0ZW1lbnQpXG4gIH1cbn1cbnR5cGUgTXV0YWJsZUFyaXRobWV0aWM8VCBleHRlbmRzIE51bVR5cGU+ID0geyBbT3AgaW4gQXJpdGhtZXRpY09wIGFzIGBpJHtPcH1gXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gdm9pZCB9XG50eXBlIE11dGFibGVJbnRlZ2VyPFQgZXh0ZW5kcyBJbnRUeXBlPiA9IHsgW09wIGluIFwiYW5kXCIgfCBcIm9yXCIgfCBcInhvclwiIGFzIGBpJHtPcH1gXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gdm9pZCB9XG5leHBvcnQgdHlwZSBNdXRhYmxlVmFsdWU8VCBleHRlbmRzIE51bVR5cGU+ID0gRXhwcjxUPiAmIHsgc2V0KHZhbHVlOiBFeHByTGlrZTxUPik6IHZvaWQgfSAmIE11dGFibGVBcml0aG1ldGljPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gTXV0YWJsZUludGVnZXI8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIExvY2FsVmFyPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IE11dGFibGVWYWx1ZTxUPiAmIExvY2FsTm9kZTxUPlxuZXhwb3J0IHR5cGUgR2xvYmFsVmFsdWU8VCBleHRlbmRzIE51bVR5cGU+ID0gTXV0YWJsZVZhbHVlPFQ+ICYgR2xvYmFsTm9kZTxUPlxuZXhwb3J0IHR5cGUgQW55R2xvYmFsID0gR2xvYmFsVmFsdWU8TnVtVHlwZT5cblxuZXhwb3J0IHR5cGUgQXJyYXlWYWx1ZTxUIGV4dGVuZHMgRFR5cGU+ID1cbiAgVCBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBNdXRhYmxlU3RydWN0PEY+IDpcbiAgVCBleHRlbmRzIE1lbW9yeVR5cGUgPyBNdXRhYmxlVmFsdWU8TG9hZGVkVHlwZTxUPj4gOiBuZXZlclxuZXhwb3J0IHR5cGUgQXJyYXlIYW5kbGU8VCBleHRlbmRzIERUeXBlPiA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IFRcbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBBcnJheVZhbHVlPFQ+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogdm9pZFxufVxuXG5leHBvcnQgdHlwZSBCaXRTdG9yYWdlVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiIHwgXCJpMzJcIlxuZXhwb3J0IHR5cGUgQml0RmllbGQgPSByZWFkb25seSBbQml0U3RvcmFnZVR5cGUsIG51bWJlcl1cbmV4cG9ydCB0eXBlIFN0cnVjdFN0b3JhZ2VUeXBlID0gUGFja2VkVHlwZSB8IEludFR5cGVcbmV4cG9ydCB0eXBlIEZpZWxkVHlwZSA9IFN0cnVjdFN0b3JhZ2VUeXBlIHwgQml0RmllbGRcbmV4cG9ydCB0eXBlIFN0cnVjdEZpZWxkcyA9IFJlY29yZDxzdHJpbmcsIEZpZWxkVHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkU3RvcmFnZTxUIGV4dGVuZHMgRmllbGRUeXBlPiA9IFQgZXh0ZW5kcyByZWFkb25seSBbaW5mZXIgUyBleHRlbmRzIEJpdFN0b3JhZ2VUeXBlLCBudW1iZXJdID8gUyA6IEV4dHJhY3Q8VCwgTWVtb3J5VHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkVmFsdWU8VCBleHRlbmRzIEZpZWxkVHlwZT4gPSBMb2FkZWRUeXBlPEZpZWxkU3RvcmFnZTxUPj5cbmV4cG9ydCB0eXBlIEZpZWxkTGF5b3V0ID0geyBzdG9yYWdlOiBTdHJ1Y3RTdG9yYWdlVHlwZSwgYml0T2Zmc2V0OiBudW1iZXIsIGJpdHM6IG51bWJlciB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RUeXBlPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBraW5kOiBcInN0cnVjdFwiXG4gIGZpZWxkczogRlxuICBsYXlvdXQ6IHsgW0sgaW4ga2V5b2YgRl06IEZpZWxkTGF5b3V0IH1cbiAgc2l6ZTogbnVtYmVyXG4gIHN0b3JhZ2U6IFwidThcIiB8IFwidTE2XCIgfCBJbnRUeXBlXG59XG50eXBlIFN0cnVjdE1lbWJlcnM8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7XG4gIFtLIGluIGtleW9mIEZdOiBFeHByPEZpZWxkVmFsdWU8RltLXT4+XG59XG50eXBlIE11dGFibGVTdHJ1Y3RNZW1iZXJzPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBbSyBpbiBrZXlvZiBGXTogTXV0YWJsZVZhbHVlPEZpZWxkVmFsdWU8RltLXT4+XG59XG5leHBvcnQgdHlwZSBTdHJ1Y3RJbml0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0geyBbSyBpbiBrZXlvZiBGXTogRXhwckxpa2U8RmllbGRWYWx1ZTxGW0tdPj4gfVxuZXhwb3J0IHR5cGUgSlNTdHJ1Y3Q8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7IFtLIGluIGtleW9mIEZdOiBWYWx1ZTxGaWVsZFZhbHVlPEZbS10+PiB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RWYWx1ZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IFN0cnVjdE1lbWJlcnM8Rj4gJiB7IHBhY2tlZDogQW55RXhwciB9XG5leHBvcnQgdHlwZSBNdXRhYmxlU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0gU3RydWN0VmFsdWU8Rj4gJiBNdXRhYmxlU3RydWN0TWVtYmVyczxGPiAmIHtcbiAgc2V0KHZhbHVlOiBNdXRhYmxlU3RydWN0PEY+IHwgU3RydWN0SW5pdDxGPik6IHZvaWRcbn1cbmV4cG9ydCB0eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPlxuZXhwb3J0IHR5cGUgRnVuY0hhbmRsZTxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4gPSB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIHBhcmFtczogQVxuICByZXN1bHQ6IFJcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IFN0bXRbXVxuICBjYWxsOiAoLi4uYXJnczogQXJnc0xpa2U8QT4pID0+XG4gICAgUiBleHRlbmRzIE51bVR5cGUgPyBFeHByPFI+IDpcbiAgICBSIGV4dGVuZHMgU3RydWN0VHlwZTxpbmZlciBGPiA/IFN0cnVjdFZhbHVlPEY+IDpcbiAgICB2b2lkXG59XG5cbmV4cG9ydCB0eXBlIEFueUZ1bmMgPSB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIHBhcmFtczogcmVhZG9ubHkgTnVtVHlwZVtdXG4gIHJlc3VsdDogUmVzdWx0VHlwZVxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEFueUV4cHJbXSkgPT4gU3RtdFtdXG4gIGNhbGw6ICguLi5hcmdzOiBhbnlbXSkgPT4gQW55RXhwclxufVxuXG5leHBvcnQgdHlwZSBBbnlBcnJheSA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IERUeXBlXG4gIGxlbmd0aDogbnVtYmVyXG4gIGVsZW1lbnRTaXplOiBudW1iZXJcbiAgYXQoLi4uYXJnczogYW55W10pOiBhbnlcbiAgbW92ZSguLi5hcmdzOiBhbnlbXSk6IHZvaWRcbn1cblxuZXhwb3J0IHR5cGUgTW9kdWxlRGVmID0gUmVjb3JkPHN0cmluZywgQW55RnVuYyB8IEFueUFycmF5IHwgQW55R2xvYmFsPlxuZXhwb3J0IHR5cGUgRnVuY0RlZnM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7IFtLIGluIGtleW9mIFQgYXMgVFtLXSBleHRlbmRzIEFueUZ1bmMgPyBLIDogbmV2ZXJdOiBFeHRyYWN0PFRbS10sIEFueUZ1bmM+IH1cbmV4cG9ydCB0eXBlIEFycmF5RGVmczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHsgW0sgaW4ga2V5b2YgVCBhcyBUW0tdIGV4dGVuZHMgQW55QXJyYXkgPyBLIDogbmV2ZXJdOiBFeHRyYWN0PFRbS10sIEFueUFycmF5PiB9XG5leHBvcnQgdHlwZSBDb21waWxlUmVzdWx0PFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0ge1xuICBbSyBpbiBrZXlvZiBUXTpcbiAgICBUW0tdIGV4dGVuZHMgQW55RnVuYyA/ICguLi5hcmdzOiBBcmdzVmFsPFRbS11bXCJwYXJhbXNcIl0+KSA9PlxuICAgICAgVFtLXVtcInJlc3VsdFwiXSBleHRlbmRzIE51bVR5cGUgPyBWYWx1ZTxUW0tdW1wicmVzdWx0XCJdPiA6XG4gICAgICBUW0tdW1wicmVzdWx0XCJdIGV4dGVuZHMgU3RydWN0VHlwZTxpbmZlciBGPiA/IEpTU3RydWN0PEY+IDpcbiAgICAgIHZvaWRcbiAgICA6IFRbS10gZXh0ZW5kcyBBcnJheUhhbmRsZTxpbmZlciBEPiA/XG4gICAgICBEIGV4dGVuZHMgTWVtb3J5VHlwZSA/IFR5cGVkQXJyYXlGb3I8RD4gOiBVaW50OEFycmF5IHwgVWludDE2QXJyYXkgfCBVaW50MzJBcnJheSB8IEJpZ1VpbnQ2NEFycmF5XG4gICAgOiBuZXZlclxufSAmIHtcbiAgbW9kOiBXZWJBc3NlbWJseS5Nb2R1bGVcbiAgbWVtb3J5OiBXZWJBc3NlbWJseS5NZW1vcnlcbiAgdHJhcE1lc3NhZ2VzOiBzdHJpbmdbXVxuICBsb2dNZXNzYWdlczogc3RyaW5nW11cbiAgcmVzdWx0U3RydWN0czogUmVjb3JkPHN0cmluZywgU3RydWN0VHlwZTxhbnk+PlxufVxuXG5cbmxldCBuZXh0TG9jYWxJZCA9IDBcbmNvbnN0IHJlY29yZGluZ1N0YWNrOiBTdG10W11bXSA9IFtdXG5sZXQgcmVjb3JkaW5nUGF1c2VkID0gMFxuXG5jb25zdCByZWNvcmRpbmcgPSAoKSA9PiByZWNvcmRpbmdQYXVzZWQgPyB1bmRlZmluZWQgOiByZWNvcmRpbmdTdGFjay5hdCgtMSlcbmNvbnN0IGVtaXQgPSA8UyBleHRlbmRzIFN0bXQ+KHN0YXRlbWVudDogUyk6IFMgPT4ge1xuICByZWNvcmRpbmcoKT8ucHVzaChzdGF0ZW1lbnQpXG4gIHJldHVybiBzdGF0ZW1lbnRcbn1cbmNvbnN0IGNhcHR1cmUgPSAoYnVpbGQ6ICgpID0+IHZvaWQpOiBTdG10W10gPT4ge1xuICBjb25zdCBzdGF0ZW1lbnRzOiBTdG10W10gPSBbXVxuICByZWNvcmRpbmdTdGFjay5wdXNoKHN0YXRlbWVudHMpXG4gIHRyeSB7IGJ1aWxkKCkgfSBmaW5hbGx5IHsgcmVjb3JkaW5nU3RhY2sucG9wKCkgfVxuICByZXR1cm4gc3RhdGVtZW50c1xufVxuY29uc3Qgd2l0aG91dFJlY29yZGluZyA9IDxUPihidWlsZDogKCkgPT4gVCk6IFQgPT4ge1xuICByZWNvcmRpbmdQYXVzZWQrK1xuICB0cnkgeyByZXR1cm4gYnVpbGQoKSB9IGZpbmFsbHkgeyByZWNvcmRpbmdQYXVzZWQtLSB9XG59XG5cbmNvbnN0IGluZmVyVHlwZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHJMaWtlPFQ+KSA9PlxuICAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIFwidHlwZVwiIGluIHZhbHVlID8gdmFsdWUudHlwZSA6IFwiaTMyXCIpIGFzIFRcblxuY29uc3QgZXhwciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obm9kZTogQ29yZUV4cHI8VD4pOiBFeHByPFQ+ID0+IHtcbiAgcmV0dXJuIE9iamVjdC5zZXRQcm90b3R5cGVPZihub2RlLCBFeHByTWV0aG9kcy5wcm90b3R5cGUpIGFzIEV4cHI8VD5cbn1cblxuZXhwb3J0IGNvbnN0IGxpdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPiA9PiB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoXCJraW5kXCIgaW4gdmFsdWUpIHJldHVybiB2YWx1ZSBhcyBFeHByPFQ+XG4gIH1cbiAgcmV0dXJuIGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGUsIHZhbHVlOiB2YWx1ZSBhcyBWYWx1ZTxUPiB9KVxufVxuY29uc3QgbXV0YWJsZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obm9kZTogQ29yZUV4cHI8VD4sIHdyaXRlOiAodmFsdWU6IEV4cHI8VD4pID0+IFN0bXQgfCB2b2lkKSA9PlxuICBPYmplY3QuYXNzaWduKE9iamVjdC5zZXRQcm90b3R5cGVPZihub2RlLCBNdXRhYmxlTWV0aG9kcy5wcm90b3R5cGUpLCB7IHdyaXRlIH0pIGFzIE11dGFibGVWYWx1ZTxUPlxuXG5jb25zdCBiaW4gPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBBcml0aG1ldGljT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT5cbiAgcmVjb3JkRXhwcihleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KSlcblxuY29uc3QgYml0ID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihvcDogQml0T3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT5cbiAgcmVjb3JkRXhwcihleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KSlcblxuY29uc3QgcmVtYWluZGVyID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihvcDogUmVtYWluZGVyT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT5cbiAgcmVjb3JkRXhwcihleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KSlcblxuY29uc3QgY21wID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQ21wT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj4gPT5cbiAgcmVjb3JkRXhwcihleHByPFwiaTMyXCI+KHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0OiBsZWZ0IGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiB9IGFzIENvcmVFeHByPFwiaTMyXCI+KSlcblxuZXhwb3J0IGNvbnN0IGFsbG9jYXRlTG9jYWwgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpID0+IGV4cHIoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbDogbmV4dExvY2FsSWQrKyB9KVxuXG5jb25zdCBta0xvY2FsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKTogTG9jYWxWYXI8VD4gPT4ge1xuICBjb25zdCBsb2NhbCA9IG5leHRMb2NhbElkKytcbiAgcmV0dXJuIG11dGFibGUoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbCB9LCB2YWx1ZSA9PiAoeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbCwgdHlwZSwgdmFsdWU6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSkpIGFzIExvY2FsVmFyPFQ+XG59XG5cbi8vIEluIHJlY29yZGVkIGZ1bmN0aW9ucywgY29uc3RydWN0aW5nIGEgY29tcHV0YXRpb24gZml4ZXMgaXRzIHZhbHVlIGF0IHRoYXRcbi8vIHBvaW50IGluIHRoZSBmbG93LiBUaGUgbG9jYWwgaXMgY29tcGlsZXIgSVI7IGF1dGhvcnMgb25seSBrZWVwIHRoZSByZXR1cm5lZFxuLy8gZXhwcmVzc2lvbiBpbiBhbiBvcmRpbmFyeSBKUyB2YXJpYWJsZS5cbmNvbnN0IHJlY29yZEV4cHIgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxUPiA9PiB7XG4gIGlmICghcmVjb3JkaW5nKCkpIHJldHVybiB2YWx1ZVxuICBjb25zdCBzbmFwc2hvdCA9IG1rTG9jYWw8VD4odmFsdWUudHlwZSBhcyBUKVxuICBzbmFwc2hvdC5zZXQodmFsdWUpXG4gIHJldHVybiBzbmFwc2hvdFxufVxuXG5jb25zdCBta0hhbmRsZSA9IDxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4oXG4gIHBhcmFtczogQSxcbiAgcmVzdWx0OiBSLFxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gU3RtdFtdLFxuKTogRnVuY0hhbmRsZTxBLCBSPiA9PiB7XG4gIGxldCBoYW5kbGUhOiBGdW5jSGFuZGxlPEEsIFI+XG4gIGhhbmRsZSA9IHtcbiAgICBraW5kOiBcImZ1bmNcIixcbiAgICBwYXJhbXMsIHJlc3VsdCwgYnVpbGQsXG4gICAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NMaWtlPEE+KSA9PiB7XG4gICAgICBjb25zdCBjYWxsQXJncyA9IHBhcmFtcy5tYXAoKHR5cGUsIGkpID0+IGxpdCh0eXBlLCBhcmdzW2ldIGFzIEV4cHJMaWtlPHR5cGVvZiB0eXBlPikpIGFzIEV4cHI8TnVtVHlwZT5bXVxuICAgICAgaWYgKHJlc3VsdCA9PT0gXCJ2b2lkXCIpIHJldHVybiBlbWl0KHsga2luZDogXCJjYWxsLnZvaWRcIiwgdGFyZ2V0OiBoYW5kbGUsIGFyZ3M6IGNhbGxBcmdzIH0pXG4gICAgICBjb25zdCB0eXBlID0gKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIgPyByZXN1bHQgOiByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiKSBhcyBOdW1UeXBlXG4gICAgICBjb25zdCBjYWxsID0gcmVjb3JkRXhwcihleHByKHsga2luZDogXCJjYWxsXCIsIHR5cGUsIHRhcmdldDogaGFuZGxlLCBhcmdzOiBjYWxsQXJncyB9KSlcbiAgICAgIHJldHVybiB0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiID8gY2FsbCA6IHJlYWRTdHJ1Y3QocmVzdWx0LCBjYWxsKVxuICAgIH0sXG4gIH0gYXMgRnVuY0hhbmRsZTxBLCBSPlxuICByZXR1cm4gaGFuZGxlXG59XG5cbmNvbnN0IGxvYWRlZFR5cGUgPSA8VCBleHRlbmRzIE1lbW9yeVR5cGU+KHR5cGU6IFQpID0+XG4gICh0eXBlID09PSBcImk4XCIgfHwgdHlwZSA9PT0gXCJ1OFwiIHx8IHR5cGUgPT09IFwiaTE2XCIgfHwgdHlwZSA9PT0gXCJ1MTZcIiA/IFwiaTMyXCIgOiB0eXBlKSBhcyBMb2FkZWRUeXBlPFQ+XG5cbmNvbnN0IHN0b3JhZ2VTaXplOiBSZWNvcmQ8TWVtb3J5VHlwZSwgbnVtYmVyPiA9IHsgaTg6IDEsIHU4OiAxLCBpMTY6IDIsIHUxNjogMiwgaTMyOiA0LCBmMzI6IDQsIGk2NDogOCwgZjY0OiA4IH1cbmNvbnN0IG1lbW9yeVZhbHVlID0gPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPihhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgc3RvcmFnZTogVCwgc3RyaWRlOiBudW1iZXIsIG9mZnNldCA9IDApID0+IHtcbiAgY29uc3QgYXQgPSBsaXQoXCJpMzJcIiwgaW5kZXgpXG4gIHJldHVybiBtdXRhYmxlKHsga2luZDogXCJsb2FkXCIsIHR5cGU6IGxvYWRlZFR5cGUoc3RvcmFnZSksIGFycmF5LCBpbmRleDogYXQsIHN0b3JhZ2UsIHN0cmlkZSwgb2Zmc2V0IH0sIHZhbHVlID0+XG4gICAgKHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheSwgdHlwZTogc3RvcmFnZSwgaW5kZXg6IGF0LCBzdHJpZGUsIG9mZnNldCwgdmFsdWU6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSkpXG59XG5cbnR5cGUgU3RydWN0QmFja2luZyA9IGFueVxudHlwZSBJbnRlcm5hbFN0cnVjdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IE11dGFibGVTdHJ1Y3Q8Rj4gJiB7IHBhY2tlZDogU3RydWN0QmFja2luZyB9XG5cbmNvbnN0IHJlYWRGaWVsZCA9IChiYWNraW5nOiBBbnlFeHByLCBmaWVsZDogRmllbGRMYXlvdXQpID0+IHtcbiAgY29uc3QgeyBiaXRzIH0gPSBmaWVsZFxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIikgcmV0dXJuIGJhY2tpbmdcbiAgaWYgKGJhY2tpbmcudHlwZSA9PT0gXCJpNjRcIikge1xuICAgIGNvbnN0IGJpdE9mZnNldCA9IEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpLCBtYXNrID0gKDFuIDw8IEJpZ0ludChiaXRzKSkgLSAxblxuICAgIGNvbnN0IHJhdyA9IGkzMihiYWNraW5nLnNocihiaXRPZmZzZXQpLmFuZChtYXNrKSlcbiAgICByZXR1cm4gZmllbGQuc3RvcmFnZS5zdGFydHNXaXRoKFwiaVwiKSAmJiBiaXRzIDwgMzJcbiAgICAgID8gaWZFbHNlKHJhdy5hbmQoMiAqKiAoYml0cyAtIDEpKSwgcmF3LnN1YigyICoqIGJpdHMpLCByYXcpXG4gICAgICA6IHJhd1xuICB9XG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImkzMlwiICYmIGZpZWxkLmJpdE9mZnNldCA9PT0gMCkgcmV0dXJuIGJhY2tpbmdcbiAgY29uc3QgbWFzayA9IDIgKiogYml0cyAtIDFcbiAgY29uc3QgcmF3ID0gYmFja2luZy5zaHIoZmllbGQuYml0T2Zmc2V0KS5hbmQobWFzaylcbiAgcmV0dXJuIGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgYml0cyA8IDMyXG4gICAgPyBpZkVsc2UocmF3LmFuZCgyICoqIChiaXRzIC0gMSkpLCByYXcuc3ViKDIgKiogYml0cyksIHJhdylcbiAgICA6IHJhd1xufVxuXG5jb25zdCBwYWNrZWRGaWVsZFZhbHVlID0gKGJhY2tpbmc6IFN0cnVjdEJhY2tpbmcsIGZpZWxkOiBGaWVsZExheW91dCkgPT4ge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRGaWVsZChiYWNraW5nLCBmaWVsZClcbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBiYWNraW5nXG4gIGlmIChiYWNraW5nLnR5cGUgPT09IFwiaTY0XCIpIHtcbiAgICBjb25zdCBiaXRPZmZzZXQgPSBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSwgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICBjb25zdCBmaWVsZE1hc2sgPSBtYXNrIDw8IGJpdE9mZnNldFxuICAgIHJldHVybiBtdXRhYmxlPFwiaTMyXCI+KHZhbHVlIGFzIEV4cHI8XCJpMzJcIj4sIGlucHV0ID0+IGJhY2tpbmcuc2V0KGJhY2tpbmcuYW5kKH5maWVsZE1hc2spLm9yKGk2NHUoaW5wdXQpLmFuZChtYXNrKS5zaGwoYml0T2Zmc2V0KSkpKVxuICB9XG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImkzMlwiICYmIGZpZWxkLmJpdE9mZnNldCA9PT0gMCkgcmV0dXJuIGJhY2tpbmdcbiAgY29uc3QgbWFzayA9IDIgKiogZmllbGQuYml0cyAtIDEsIGZpZWxkTWFzayA9IG1hc2sgPDwgZmllbGQuYml0T2Zmc2V0XG4gIHJldHVybiBtdXRhYmxlPFwiaTMyXCI+KHZhbHVlLCBpbnB1dCA9PiBiYWNraW5nLnNldChiYWNraW5nLmFuZCh+ZmllbGRNYXNrKS5vcihpbnB1dC5hbmQobWFzaykuc2hsKGZpZWxkLmJpdE9mZnNldCkpKSlcbn1cblxuY29uc3QgcmVhZFN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCBwYWNrZWQ6IEFueUV4cHIpOiBTdHJ1Y3RWYWx1ZTxGPiA9PlxuICB3aXRob3V0UmVjb3JkaW5nKCgpID0+IE9iamVjdC5hc3NpZ24oT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5tYXAobmFtZSA9PiBbbmFtZSwgcmVhZEZpZWxkKHBhY2tlZCwgdHlwZS5sYXlvdXRbbmFtZV0hKV0pKSwgeyBwYWNrZWQgfSkpIGFzIFN0cnVjdFZhbHVlPEY+XG5cbmNvbnN0IHN0cnVjdFZhbHVlID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHBhY2tlZDogU3RydWN0QmFja2luZyk6IE11dGFibGVTdHJ1Y3Q8Rj4gPT4ge1xuICBjb25zdCBmaWVsZHMgPSB3aXRob3V0UmVjb3JkaW5nKCgpID0+IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykubWFwKG5hbWUgPT4gW25hbWUsIHBhY2tlZEZpZWxkVmFsdWUocGFja2VkLCB0eXBlLmxheW91dFtuYW1lXSEpIF0pKSlcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oZmllbGRzLCB7IHBhY2tlZCwgc2V0OiAodmFsdWU6IE11dGFibGVTdHJ1Y3Q8Rj4gfCBTdHJ1Y3RJbml0PEY+KSA9PlxuICAgIHBhY2tlZC5zZXQoXCJwYWNrZWRcIiBpbiB2YWx1ZSA/ICh2YWx1ZSBhcyBJbnRlcm5hbFN0cnVjdDxGPikucGFja2VkIDogcGFja1N0cnVjdCh0eXBlLCB2YWx1ZSkpIH0pIGFzIEludGVybmFsU3RydWN0PEY+XG59XG5cbmNvbnN0IHBhY2tTdHJ1Y3QgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgdmFsdWVzOiBTdHJ1Y3RJbml0PEY+KTogQW55RXhwciA9PiB7XG4gIGlmICh0eXBlLnN0b3JhZ2UgIT09IFwiaTY0XCIpIHJldHVybiBPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykucmVkdWNlKChwYWNrZWQsIG5hbWUpID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IHR5cGUubGF5b3V0W25hbWVdISwgdmFsdWUgPSB2YWx1ZXNbbmFtZV0hXG4gICAgY29uc3QgbWFzayA9IDIgKiogZmllbGQuYml0cyAtIDFcbiAgICByZXR1cm4gcGFja2VkLm9yKGxpdChcImkzMlwiLCB2YWx1ZSBhcyBFeHByTGlrZTxcImkzMlwiPikuYW5kKG1hc2spLnNobChmaWVsZC5iaXRPZmZzZXQpKVxuICB9LCBpMzIoMCkpXG4gIHJldHVybiBPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykucmVkdWNlKChwYWNrZWQsIG5hbWUpID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IHR5cGUubGF5b3V0W25hbWVdISwgdmFsdWUgPSB2YWx1ZXNbbmFtZV0hXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBsaXQoXCJpNjRcIiwgdmFsdWUgYXMgRXhwckxpa2U8XCJpNjRcIj4pXG4gICAgY29uc3QgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICByZXR1cm4gcGFja2VkLm9yKGk2NHUobGl0KFwiaTMyXCIsIHZhbHVlIGFzIEV4cHJMaWtlPFwiaTMyXCI+KSkuYW5kKG1hc2spLnNobChCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkpXG4gIH0sIGk2NCgwbikpXG59XG5cbmV4cG9ydCBjb25zdCBzdHJ1Y3QgPSA8Y29uc3QgRiBleHRlbmRzIFN0cnVjdEZpZWxkcz4oZmllbGRzOiBGKTogU3RydWN0VHlwZTxGPiA9PiB7XG4gIGlmIChcInNldFwiIGluIGZpZWxkcyB8fCBcInBhY2tlZFwiIGluIGZpZWxkcykgdGhyb3cgbmV3IEVycm9yKFwiU3RydWN0IGZpZWxkcyBjYW5ub3QgYmUgbmFtZWQgc2V0IG9yIHBhY2tlZFwiKVxuICBsZXQgdXNlZCA9IDBcbiAgY29uc3QgbGF5b3V0OiBQYXJ0aWFsPFJlY29yZDxrZXlvZiBGLCBGaWVsZExheW91dD4+ID0ge31cbiAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKGZpZWxkcykgYXMgKGtleW9mIEYpW10pIHtcbiAgICBjb25zdCBmaWVsZCA9IGZpZWxkc1tuYW1lXSFcbiAgICBjb25zdCBzdG9yYWdlID0gKEFycmF5LmlzQXJyYXkoZmllbGQpID8gZmllbGRbMF0gOiBmaWVsZCkgYXMgU3RydWN0U3RvcmFnZVR5cGVcbiAgICBjb25zdCBiaXRzID0gQXJyYXkuaXNBcnJheShmaWVsZCkgPyBmaWVsZFsxXSA6IHN0b3JhZ2VTaXplW3N0b3JhZ2VdICogOFxuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihiaXRzKSB8fCBiaXRzIDwgMSB8fCBiaXRzID4gc3RvcmFnZVNpemVbc3RvcmFnZV0gKiA4KSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgJHtzdG9yYWdlfSBiaXQtZmllbGQgd2lkdGggJHtiaXRzfWApXG4gICAgaWYgKHVzZWQgKyBiaXRzID4gNjQpIHRocm93IG5ldyBFcnJvcihgU3RydWN0IHJlcXVpcmVzICR7dXNlZCArIGJpdHN9IGJpdHM7IG1heGltdW0gaXMgNjRgKVxuICAgIGxheW91dFtuYW1lXSA9IHsgc3RvcmFnZSwgYml0T2Zmc2V0OiB1c2VkLCBiaXRzIH1cbiAgICB1c2VkICs9IGJpdHNcbiAgfVxuICBjb25zdCBzdG9yYWdlID0gdXNlZCA8PSA4ID8gXCJ1OFwiIDogdXNlZCA8PSAxNiA/IFwidTE2XCIgOiB1c2VkIDw9IDMyID8gXCJpMzJcIiA6IFwiaTY0XCJcbiAgcmV0dXJuIHsga2luZDogXCJzdHJ1Y3RcIiwgZmllbGRzLCBsYXlvdXQ6IGxheW91dCBhcyB7IFtLIGluIGtleW9mIEZdOiBGaWVsZExheW91dCB9LCBzdG9yYWdlLCBzaXplOiBzdG9yYWdlU2l6ZVtzdG9yYWdlXSB9XG59XG5cbmNvbnN0IGNhc3QgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiBFeHByPE51bVR5cGU+LCB1bnNpZ25lZCA9IGZhbHNlKTogRXhwcjxUPiA9PlxuICB2YWx1ZS50eXBlID09PSB0eXBlID8gdmFsdWUgYXMgdW5rbm93biBhcyBFeHByPFQ+IDogcmVjb3JkRXhwcihleHByPFQ+KHsga2luZDogXCJjYXN0XCIsIHR5cGUsIGlucHV0VHlwZTogdmFsdWUudHlwZSwgdW5zaWduZWQsIHZhbHVlIH0gYXMgQ29yZUV4cHI8VD4pKVxuY29uc3QgbnVtYmVyID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogdW5rbm93bik6IEV4cHI8VD4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSAodHlwZSA9PT0gXCJpNjRcIiA/IFwiYmlnaW50XCIgOiBcIm51bWJlclwiKVxuICAgID8gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZSwgdmFsdWUgfSBhcyBDb3JlRXhwcjxUPilcbiAgICA6IGNhc3QodHlwZSwgdmFsdWUgYXMgRXhwcjxOdW1UeXBlPilcblxuZXhwb3J0IGZ1bmN0aW9uIGkzMih2YWx1ZTogbnVtYmVyKTogRXhwcjxcImkzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGkzMjxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiaTMyXCI+XG5leHBvcnQgZnVuY3Rpb24gaTMyKHZhbHVlOiB1bmtub3duKSB7IHJldHVybiBudW1iZXIoXCJpMzJcIiwgdmFsdWUpIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGk2NCh2YWx1ZTogYmlnaW50KTogRXhwcjxcImk2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGk2NDxUIGV4dGVuZHMgSW50VHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiaTY0XCI+XG5leHBvcnQgZnVuY3Rpb24gaTY0KHZhbHVlOiB1bmtub3duKSB7IHJldHVybiBudW1iZXIoXCJpNjRcIiwgdmFsdWUpIH1cbmV4cG9ydCBjb25zdCBpNjR1ID0gKHZhbHVlOiBFeHByPFwiaTMyXCI+KSA9PiBjYXN0KFwiaTY0XCIsIHZhbHVlIGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiwgdHJ1ZSlcblxudHlwZSBGMzJJbnB1dCA9IG51bWJlciB8IEV4cHI8XCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBmMzIodmFsdWU6IG51bWJlcik6IEV4cHI8XCJmMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBmMzI8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImYzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGYzMih2YWx1ZTogRjMySW5wdXQpIHsgcmV0dXJuIG51bWJlcihcImYzMlwiLCB2YWx1ZSkgfVxuXG5leHBvcnQgZnVuY3Rpb24gZjY0KHZhbHVlOiBudW1iZXIpOiBFeHByPFwiZjY0XCI+XG5leHBvcnQgZnVuY3Rpb24gZjY0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJmNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBmNjQodmFsdWU6IEYzMklucHV0KSB7IHJldHVybiBudW1iZXIoXCJmNjRcIiwgdmFsdWUpIH1cblxuZXhwb3J0IGNvbnN0IGlmRWxzZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4oY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZV86IEV4cHI8VD4pOiBFeHByPFQ+ID0+XG4gIHJlY29yZEV4cHIoZXhwcjxUPih7IGtpbmQ6IFwiaWZcIiwgdHlwZTogdGhlbi50eXBlLCBjb25kLCB0aGVuLCBlbHNlOiBlbHNlXyB9IGFzIENvcmVFeHByPFQ+KSlcblxuY29uc3QgYXJpdGhtZXRpYyA9IE9iamVjdC5mcm9tRW50cmllcyhhcml0aG1ldGljT3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4ob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBBcml0aG1ldGljT3BdOiA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5jb25zdCBiaXRzID0gT2JqZWN0LmZyb21FbnRyaWVzKGJpdE9wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYml0KG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gQml0T3BdOiA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5jb25zdCByZW1haW5kZXJzID0gT2JqZWN0LmZyb21FbnRyaWVzKHJlbWFpbmRlck9wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gcmVtYWluZGVyKG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gUmVtYWluZGVyT3BdOiA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5jb25zdCBjb21wYXJpc29ucyA9IE9iamVjdC5mcm9tRW50cmllcyhjbXBPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGNtcChvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIENtcE9wXTogPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8XCJpMzJcIj4gfVxuXG5mb3IgKGNvbnN0IG9wIG9mIGFyaXRobWV0aWNPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxOdW1UeXBlPikgeyByZXR1cm4gYXJpdGhtZXRpY1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiBiaXRPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8SW50VHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxJbnRUeXBlPikgeyByZXR1cm4gYml0c1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiByZW1haW5kZXJPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8SW50VHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxJbnRUeXBlPikgeyByZXR1cm4gcmVtYWluZGVyc1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiBjbXBPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxOdW1UeXBlPikgeyByZXR1cm4gY29tcGFyaXNvbnNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgWy4uLmFyaXRobWV0aWNPcHMsIFwiYW5kXCIsIFwib3JcIiwgXCJ4b3JcIl0gYXMgY29uc3QpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNdXRhYmxlTWV0aG9kcy5wcm90b3R5cGUsIGBpJHtvcH1gLCB7XG4gIHZhbHVlKHRoaXM6IE11dGFibGVWYWx1ZTxhbnk+LCByaWdodDogYW55KSB7IHJldHVybiB0aGlzLnNldCgodGhpcyBhcyBhbnkpW29wXShyaWdodCkpIH0sXG59KVxuXG5leHBvcnQgY29uc3QgeyBhZGQsIHN1YiwgbXVsLCBkaXYgfSA9IGFyaXRobWV0aWNcbmV4cG9ydCBjb25zdCB7IGFuZCwgb3IsIHhvciwgc2hsLCBzaHIgfSA9IGJpdHNcbmV4cG9ydCBjb25zdCB7IG1vZCwgdW1vZCB9ID0gcmVtYWluZGVyc1xuZXhwb3J0IGNvbnN0IHsgZXEsIGx0LCBndCB9ID0gY29tcGFyaXNvbnNcblxuZXhwb3J0IGNvbnN0IGZuID0gPGNvbnN0IEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPihcbiAgcGFyYW1zOiBBLFxuICByZXN1bHQ6IFIsXG4gIGJ1aWxkOiAoLi4uYXJnczogQXJnc0V4cHI8QT4pID0+IEZuUmV0dXJuPFI+LFxuKSA9PiBta0hhbmRsZShwYXJhbXMsIHJlc3VsdCwgKCguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4ge1xuICBsZXQgcmV0dXJuZWQgPSB1bmRlZmluZWQgYXMgRm5SZXR1cm48Uj5cbiAgY29uc3Qgc3RhdGVtZW50cyA9IGNhcHR1cmUoKCkgPT4geyByZXR1cm5lZCA9IGJ1aWxkKC4uLmFyZ3MpIH0pXG4gIGlmIChBcnJheS5pc0FycmF5KHJldHVybmVkKSkgdGhyb3cgbmV3IEVycm9yKFwiV0FTTSBmdW5jdGlvbnMgcmVjb3JkIHN0YXRlbWVudHM7IHJldHVybmluZyBzdGF0ZW1lbnQgYXJyYXlzIGlzIG5vdCBzdXBwb3J0ZWRcIilcbiAgaWYgKHJldHVybmVkICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHR5cGVvZiByZXR1cm5lZCA9PT0gXCJvYmplY3RcIiAmJiBcInBhY2tlZFwiIGluIHJldHVybmVkID8gcmV0dXJuZWQucGFja2VkIDogcmV0dXJuZWRcbiAgICBzdGF0ZW1lbnRzLnB1c2goeyBraW5kOiBcInJldHVyblwiLCB2YWx1ZTogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KVxuICB9XG4gIHJldHVybiBzdGF0ZW1lbnRzXG59KSBhcyAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBTdG10W10pXG5leHBvcnQgZnVuY3Rpb24gYXJyYXk8VCBleHRlbmRzIERUeXBlPih0eXBlOiBULCBsZW5ndGg6IG51bWJlcik6IEFycmF5SGFuZGxlPFQ+IHtcbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGxlbmd0aCkgfHwgbGVuZ3RoIDw9IDApIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBhcnJheSBsZW5ndGggJHtsZW5ndGh9YClcbiAgY29uc3Qgc3RydWN0ID0gdHlwZW9mIHR5cGUgPT09IFwib2JqZWN0XCIgPyB0eXBlIDogbnVsbFxuICBjb25zdCBzdG9yYWdlOiBNZW1vcnlUeXBlID0gc3RydWN0ID8gc3RydWN0LnN0b3JhZ2UgOiB0eXBlIGFzIE1lbW9yeVR5cGVcbiAgY29uc3QgZWxlbWVudFNpemUgPSBzdHJ1Y3QgPyBzdHJ1Y3Quc2l6ZSA6IHN0b3JhZ2VTaXplW3N0b3JhZ2VdXG4gIGxldCBoYW5kbGU6IEFueUFycmF5XG4gIGhhbmRsZSA9IHtcbiAgICBraW5kOiBcImFycmF5XCIsIHR5cGUsIGxlbmd0aCwgZWxlbWVudFNpemUsXG4gICAgYXQ6IGluZGV4ID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gbWVtb3J5VmFsdWUoaGFuZGxlLCBpbmRleCwgc3RvcmFnZSwgZWxlbWVudFNpemUpXG4gICAgICByZXR1cm4gc3RydWN0ID8gc3RydWN0VmFsdWUoc3RydWN0LCB2YWx1ZSkgOiB2YWx1ZVxuICAgIH0sXG4gICAgbW92ZTogKHRhcmdldCwgc291cmNlLCBjb3VudCkgPT4gZW1pdCh7IGtpbmQ6IFwiYXJyYXkubW92ZVwiLCBhcnJheTogaGFuZGxlLCB0YXJnZXQ6IGxpdChcImkzMlwiLCB0YXJnZXQpLCBzb3VyY2U6IGxpdChcImkzMlwiLCBzb3VyY2UpLCBjb3VudDogbGl0KFwiaTMyXCIsIGNvdW50KSB9KSxcbiAgfVxuICByZXR1cm4gaGFuZGxlIGFzIEFycmF5SGFuZGxlPFQ+XG59XG5cbmNvbnN0IG1rU3RydWN0TG9jYWwgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPikgPT5cbiAgc3RydWN0VmFsdWUodHlwZSwgbWtMb2NhbCh0eXBlLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyBcImk2NFwiIDogXCJpMzJcIikpXG5cbnR5cGUgTG9jYWxGYWN0b3J5ID0ge1xuICA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiBMb2NhbFZhcjxUPlxuICA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPik6IE11dGFibGVTdHJ1Y3Q8Rj5cbn1cblxuY29uc3QgbG9jYWwgPSAoPFQgZXh0ZW5kcyBOdW1UeXBlLCBGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBUIHwgU3RydWN0VHlwZTxGPikgPT5cbiAgdHlwZW9mIHR5cGUgPT09IFwic3RyaW5nXCIgPyBta0xvY2FsKHR5cGUpIDogbWtTdHJ1Y3RMb2NhbCh0eXBlKSkgYXMgTG9jYWxGYWN0b3J5XG5cbmV4cG9ydCBmdW5jdGlvbiB2YXJpYWJsZShpbml0aWFsOiBudW1iZXIpOiBMb2NhbFZhcjxcImkzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKGluaXRpYWw6IGJpZ2ludCk6IExvY2FsVmFyPFwiaTY0XCI+XG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGU8VCBleHRlbmRzIE51bVR5cGU+KGluaXRpYWw6IEV4cHI8VD4pOiBMb2NhbFZhcjxUPlxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlPFQgZXh0ZW5kcyBOdW1UeXBlPihpbml0aWFsOiBFeHByTGlrZTxUPik6IExvY2FsVmFyPFQ+XG5leHBvcnQgZnVuY3Rpb24gdmFyaWFibGU8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgaW5pdGlhbD86IE11dGFibGVTdHJ1Y3Q8Rj4gfCBTdHJ1Y3RJbml0PEY+KTogTXV0YWJsZVN0cnVjdDxGPlxuZXhwb3J0IGZ1bmN0aW9uIHZhcmlhYmxlKGluaXRpYWxPclR5cGU6IGFueSwgaW5pdGlhbD86IGFueSk6IGFueSB7XG4gIGlmICh0eXBlb2YgaW5pdGlhbE9yVHlwZSA9PT0gXCJvYmplY3RcIiAmJiBpbml0aWFsT3JUeXBlLmtpbmQgPT09IFwic3RydWN0XCIpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGxvY2FsKGluaXRpYWxPclR5cGUpXG4gICAgaWYgKGluaXRpYWwgIT09IHVuZGVmaW5lZCkgdmFsdWUuc2V0KGluaXRpYWwpXG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cbiAgY29uc3QgdmFsdWUgPSBsb2NhbChpbmZlclR5cGUoaW5pdGlhbE9yVHlwZSkpXG4gIHZhbHVlLnNldChpbml0aWFsT3JUeXBlKVxuICByZXR1cm4gdmFsdWVcbn1cblxuY29uc3QgZXhwSW1wbCA9IGZuKFtcImYzMlwiXSwgXCJmMzJcIiwgeCA9PiB7XG4gIGNvbnN0IHkgPSB2YXJpYWJsZShpZkVsc2UoeC5sdCgtMTYpLCBmMzIoLTE2KSwgaWZFbHNlKHguZ3QoMTYpLCBmMzIoMTYpLCB4KSkuZGl2KDIwNDgpLmFkZCgxKSlcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMTsgaSsrKSB5LmltdWwoeSlcbiAgcmV0dXJuIHlcbn0pXG5leHBvcnQgY29uc3QgZXhwID0gKHZhbHVlOiBFeHByTGlrZTxcImYzMlwiPikgPT4gZXhwSW1wbC5jYWxsKHZhbHVlKVxuXG5leHBvcnQgY29uc3QgZ2xvYmFsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCBpbml0aWFsOiBWYWx1ZTxUPik6IEdsb2JhbFZhbHVlPFQ+ID0+IHtcbiAgbGV0IHZhbHVlITogR2xvYmFsVmFsdWU8VD5cbiAgdmFsdWUgPSBtdXRhYmxlKHsga2luZDogXCJnbG9iYWwuZ2V0XCIsIHR5cGUsIGluaXRpYWwgfSwgaW5wdXQgPT5cbiAgICAoeyBraW5kOiBcImdsb2JhbC5zZXRcIiwgZ2xvYmFsOiB2YWx1ZSBhcyB1bmtub3duIGFzIEFueUdsb2JhbCwgdmFsdWU6IGlucHV0IGFzIEV4cHI8TnVtVHlwZT4gfSkpIGFzIEdsb2JhbFZhbHVlPFQ+XG4gIHJldHVybiB2YWx1ZVxufVxuXG5leHBvcnQgY29uc3QgcmV0dXJuXyA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU/OiBFeHByTGlrZTxUPiB8IHsgcGFja2VkOiBBbnlFeHByIH0pOiB2b2lkID0+IHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIGVtaXQoeyBraW5kOiBcInJldHVyblwiIH0pXG4gIGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiBcInBhY2tlZFwiIGluIHZhbHVlKSBlbWl0KHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU6IHZhbHVlLnBhY2tlZCB9KVxuICBlbHNlIGVtaXQoeyBraW5kOiBcInJldHVyblwiLCB2YWx1ZTogbGl0KGluZmVyVHlwZSh2YWx1ZSksIHZhbHVlKSBhcyBFeHByPE51bVR5cGU+IH0pXG59XG5leHBvcnQgY29uc3QgdHJhcCA9IChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkID0+IHsgZW1pdCh7IGtpbmQ6IFwidHJhcFwiLCBtZXNzYWdlIH0pIH1cbmV4cG9ydCBjb25zdCBib3VuZHNDaGVjayA9IChhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+ID0gMSk6IHZvaWQgPT4ge1xuICBjb25zdCBpID0gbGl0KFwiaTMyXCIsIGluZGV4KSwgbiA9IGxpdChcImkzMlwiLCBjb3VudClcbiAgd2hlbihpLmx0KDApLm9yKG4ubHQoMCkpLm9yKG4uZ3QoYXJyYXkubGVuZ3RoKSkub3IoaS5ndChpMzIoYXJyYXkubGVuZ3RoKS5zdWIobikpKSwgKCkgPT4gdHJhcChcImFycmF5IGJvdW5kcyBleGNlZWRlZFwiKSlcbn1cbmV4cG9ydCBjb25zdCBsb2cgPSAobWVzc2FnZTogc3RyaW5nLCB2YWx1ZTogRXhwckxpa2U8XCJpMzJcIj4pOiB2b2lkID0+IHsgZW1pdCh7IGtpbmQ6IFwibG9nXCIsIG1lc3NhZ2UsIHZhbHVlOiBsaXQoXCJpMzJcIiwgdmFsdWUpIH0pIH1cblxuLyoqIFJlY29yZGVkIGNvbnRyb2wgZmxvdy4gQ2FsbGJhY2tzIGNhcHR1cmUgdGhlaXIgc3RhdGVtZW50cyBpbnRvIG5lc3RlZCBJUi4gKi9cbmV4cG9ydCBjb25zdCB3aGVuID0gKGNvbmRpdGlvbjogRXhwckxpa2U8XCJpMzJcIj4sIHRoZW46ICgpID0+IHZvaWQsIGVsc2VfPzogKCkgPT4gdm9pZCk6IHZvaWQgPT4ge1xuICBlbWl0KHsga2luZDogXCJpZlwiLCBjb25kOiBsaXQoXCJpMzJcIiwgY29uZGl0aW9uKSwgdGhlbjogY2FwdHVyZSh0aGVuKSwgZWxzZTogZWxzZV8gPyBjYXB0dXJlKGVsc2VfKSA6IFtdIH0pXG59XG5cbi8qKiBBIGNhbGxiYWNrIGtlZXBzIHRoZSBjb25kaXRpb24gbGl2ZSBzbyBpdCBpcyBldmFsdWF0ZWQgb24gZXZlcnkgaXRlcmF0aW9uLiAqL1xuZXhwb3J0IGNvbnN0IHdoaWxlXyA9IChjb25kaXRpb246ICgpID0+IEV4cHI8XCJpMzJcIj4sIGJvZHk6ICgpID0+IHZvaWQpOiB2b2lkID0+IHtcbiAgbGV0IGNvbmQhOiBFeHByPFwiaTMyXCI+XG4gIGNvbnN0IGNvbmRpdGlvblN0YXRlbWVudHMgPSBjYXB0dXJlKCgpID0+IHsgY29uZCA9IGNvbmRpdGlvbigpIH0pXG4gIHJlY29yZGluZygpPy5wdXNoKC4uLmNvbmRpdGlvblN0YXRlbWVudHMpXG4gIGVtaXQoeyBraW5kOiBcImxvb3BcIiwgY29uZCwgYm9keTogWy4uLmNhcHR1cmUoYm9keSksIC4uLmNvbmRpdGlvblN0YXRlbWVudHNdIH0pXG59XG5cbmV4cG9ydCBjb25zdCBmb3JfID0gKHN0YXJ0OiBFeHByTGlrZTxcImkzMlwiPiwgZW5kOiBFeHByTGlrZTxcImkzMlwiPiwgYm9keTogKGluZGV4OiBMb2NhbFZhcjxcImkzMlwiPikgPT4gdm9pZCk6IHZvaWQgPT4ge1xuICBjb25zdCBpbmRleCA9IG1rTG9jYWwoXCJpMzJcIilcbiAgZW1pdCh7IGtpbmQ6IFwiZm9yXCIsIGxvY2FsOiBpbmRleC5sb2NhbCwgc3RhcnQ6IGxpdChcImkzMlwiLCBzdGFydCksIGVuZDogbGl0KFwiaTMyXCIsIGVuZCksIGJvZHk6IGNhcHR1cmUoKCkgPT4gYm9keShpbmRleCkpIH0pXG59XG4iLAogICAgImltcG9ydCB7XG4gIGFsbG9jYXRlTG9jYWwsXG4gIHR5cGUgQW55QXJyYXksIHR5cGUgQW55RnVuYywgdHlwZSBBbnlHbG9iYWwsIHR5cGUgQXJyYXlEZWZzLCB0eXBlIEV4cHIsXG4gIHR5cGUgRnVuY0RlZnMsIHR5cGUgTW9kdWxlRGVmLCB0eXBlIE51bVR5cGUsXG59IGZyb20gXCIuL2FzdFwiXG5cbmNvbnN0IGRpZSA9ICh4OiB1bmtub3duKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgdmFsdWU6ICR7U3RyaW5nKHgpfWApIH1cbmV4cG9ydCB0eXBlIEFycmF5TGF5b3V0ID0geyBsZW5ndGg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIsIGVsZW1lbnRTaXplOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgTW9kdWxlQW5hbHlzaXM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7XG4gIGZ1bmNzOiBGdW5jRGVmczxUPlxuICBhcnJheXM6IEFycmF5RGVmczxUPlxuICBmRW50cmllczogW2tleW9mIEZ1bmNEZWZzPFQ+ICYgc3RyaW5nLCBGdW5jRGVmczxUPltrZXlvZiBGdW5jRGVmczxUPl1dW11cbiAgYnVpbHRGdW5jczogQnVpbHRGdW5jW11cbiAgZml4OiBNYXA8QW55RnVuYywgbnVtYmVyPlxuICBsYXlvdXRzOiBNYXA8QW55QXJyYXksIEFycmF5TGF5b3V0PlxuICBnbG9iYWxzOiBNYXA8QW55R2xvYmFsLCBudW1iZXI+XG4gIHRyYXBNZXNzYWdlczogc3RyaW5nW11cbiAgbG9nTWVzc2FnZXM6IHN0cmluZ1tdXG4gIHBhZ2VzOiBudW1iZXJcbn1cblxudHlwZSBWaXNpdG9ycyA9IHtcbiAgbG9jYWw/OiAoaWQ6IG51bWJlciwgdHlwZTogTnVtVHlwZSkgPT4gdm9pZFxuICBhcnJheT86IChhcnJheTogQW55QXJyYXkpID0+IHZvaWRcbiAgZnVuYz86IChmdW5jOiBBbnlGdW5jKSA9PiB2b2lkXG4gIGdsb2JhbD86IChnbG9iYWw6IEFueUdsb2JhbCkgPT4gdm9pZFxuICB0cmFwPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxuICBsb2c/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG59XG5jb25zdCB3YWxrID0gKG5vZGU6IGFueSwgZm5zOiBWaXNpdG9ycyk6IHZvaWQgPT4ge1xuICBpZiAobm9kZSA9PSBudWxsKSByZXR1cm5cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHJldHVybiBub2RlLmZvckVhY2goeCA9PiB3YWxrKHgsIGZucykpXG4gIGNvbnN0IGNoaWxkcmVuID0gKC4uLnZhbHVlczogYW55W10pID0+IHZhbHVlcy5mb3JFYWNoKHggPT4gd2Fsayh4LCBmbnMpKVxuICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgIGNhc2UgXCJjb25zdFwiOiByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6IGZucy5sb2NhbD8uKG5vZGUubG9jYWwsIG5vZGUudHlwZSk7IHJldHVyblxuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjogZm5zLmxvY2FsPy4obm9kZS5sb2NhbCwgbm9kZS50eXBlKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJnbG9iYWwuZ2V0XCI6IGZucy5nbG9iYWw/Lihub2RlKTsgcmV0dXJuXG4gICAgY2FzZSBcImdsb2JhbC5zZXRcIjogZm5zLmdsb2JhbD8uKG5vZGUuZ2xvYmFsKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJiaW5cIjogY2FzZSBcImNtcFwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5sZWZ0LCBub2RlLnJpZ2h0KVxuICAgIGNhc2UgXCJjYWxsXCI6IGNhc2UgXCJjYWxsLnZvaWRcIjogZm5zLmZ1bmM/Lihub2RlLnRhcmdldCk7IHJldHVybiB3YWxrKG5vZGUuYXJncywgZm5zKVxuICAgIGNhc2UgXCJjYXN0XCI6IGNhc2UgXCJyZXR1cm5cIjogcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJpZlwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5jb25kLCBub2RlLnRoZW4sIG5vZGUuZWxzZSlcbiAgICBjYXNlIFwibG9hZFwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIHdhbGsobm9kZS5pbmRleCwgZm5zKVxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIGNoaWxkcmVuKG5vZGUuaW5kZXgsIG5vZGUudmFsdWUpXG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiBjaGlsZHJlbihub2RlLnRhcmdldCwgbm9kZS5zb3VyY2UsIG5vZGUuY291bnQpXG4gICAgY2FzZSBcImxvb3BcIjogcmV0dXJuIGNoaWxkcmVuKG5vZGUuY29uZCwgbm9kZS5ib2R5KVxuICAgIGNhc2UgXCJmb3JcIjogZm5zLmxvY2FsPy4obm9kZS5sb2NhbCwgXCJpMzJcIik7IHJldHVybiBjaGlsZHJlbihub2RlLnN0YXJ0LCBub2RlLmVuZCwgbm9kZS5ib2R5KVxuICAgIGNhc2UgXCJ0cmFwXCI6IGZucy50cmFwPy4obm9kZS5tZXNzYWdlKTsgcmV0dXJuXG4gICAgY2FzZSBcImxvZ1wiOiBmbnMubG9nPy4obm9kZS5tZXNzYWdlKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGRlZmF1bHQ6IGRpZShub2RlKVxuICB9XG59XG5cblxuY29uc3QgYXJyYXlMYXlvdXRzID0gKGFycmF5czogQW55QXJyYXlbXSkgPT4ge1xuICBsZXQgb2Zmc2V0ID0gMFxuICBjb25zdCBsYXlvdXRzID0gbmV3IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+KClcbiAgZm9yIChjb25zdCBhcnIgb2YgYXJyYXlzKSB7XG4gICAgY29uc3QgYWxpZ24gPSBNYXRoLm1pbihhcnIuZWxlbWVudFNpemUsIDgpXG4gICAgb2Zmc2V0ID0gTWF0aC5jZWlsKG9mZnNldCAvIGFsaWduKSAqIGFsaWduXG4gICAgbGF5b3V0cy5zZXQoYXJyLCB7IGxlbmd0aDogYXJyLmxlbmd0aCwgb2Zmc2V0LCBlbGVtZW50U2l6ZTogYXJyLmVsZW1lbnRTaXplIH0pXG4gICAgb2Zmc2V0ICs9IGFyci5sZW5ndGggKiBhcnIuZWxlbWVudFNpemVcbiAgfVxuICByZXR1cm4geyBsYXlvdXRzLCBieXRlczogb2Zmc2V0IH1cbn1cblxuZXhwb3J0IHR5cGUgQnVpbHRGdW5jID0ge1xuICBmdW5jOiBBbnlGdW5jXG4gIGJ1aWx0OiBpbXBvcnQoXCIuL2FzdFwiKS5TdG10W11cbiAgbG9jYWxzOiBbbnVtYmVyLCBOdW1UeXBlXVtdXG4gIGxvY2FsSW5kZXhlczogUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICBmdW5jdGlvbnM6IEFueUZ1bmNbXVxuICBhcnJheXM6IEFueUFycmF5W11cbiAgdHJhcHM6IHN0cmluZ1tdXG4gIGxvZ3M6IHN0cmluZ1tdXG4gIGdsb2JhbHM6IEFueUdsb2JhbFtdXG59XG5cbmNvbnN0IGJ1aWxkRnVuYyA9IChmdW5jOiBBbnlGdW5jKTogQnVpbHRGdW5jID0+IHtcbiAgY29uc3QgcGFyYW1zID0gZnVuYy5wYXJhbXMubWFwKHR5cGUgPT4gYWxsb2NhdGVMb2NhbCh0eXBlKSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gIGNvbnN0IHBhcmFtSWRzID0gcGFyYW1zLm1hcChwID0+IHAua2luZCA9PT0gXCJsb2NhbC5nZXRcIiA/IHAubG9jYWwgOiAtMSlcbiAgY29uc3QgcmVzdWx0ID0gZnVuYy5idWlsZCguLi5wYXJhbXMpXG4gIGNvbnN0IGJ1aWx0ID0gcmVzdWx0XG4gIGNvbnN0IGZvdW5kID0gbmV3IE1hcDxudW1iZXIsIE51bVR5cGU+KClcbiAgY29uc3QgZnVuY3Rpb25zID0gbmV3IFNldDxBbnlGdW5jPigpLCBhcnJheXMgPSBuZXcgU2V0PEFueUFycmF5PigpLCBnbG9iYWxzID0gbmV3IFNldDxBbnlHbG9iYWw+KCksIHRyYXBzID0gbmV3IFNldDxzdHJpbmc+KCksIGxvZ3MgPSBuZXcgU2V0PHN0cmluZz4oKVxuICB3YWxrKGJ1aWx0LCB7XG4gICAgbG9jYWw6IChpZCwgdHlwZSkgPT4gZm91bmQuc2V0KGlkLCB0eXBlKSwgZnVuYzogZiA9PiBmdW5jdGlvbnMuYWRkKGYpLCBhcnJheTogYSA9PiBhcnJheXMuYWRkKGEpLFxuICAgIGdsb2JhbDogdmFsdWUgPT4gZ2xvYmFscy5hZGQodmFsdWUpLCB0cmFwOiBtZXNzYWdlID0+IHRyYXBzLmFkZChtZXNzYWdlKSwgbG9nOiBtZXNzYWdlID0+IGxvZ3MuYWRkKG1lc3NhZ2UpLFxuICB9KVxuICBwYXJhbUlkcy5mb3JFYWNoKGlkID0+IGZvdW5kLmRlbGV0ZShpZCkpXG4gIGNvbnN0IGxvY2FscyA9IFsuLi5mb3VuZC5lbnRyaWVzKCldXG4gIGNvbnN0IGxvY2FsSW5kZXhlcyA9IE9iamVjdC5mcm9tRW50cmllcyhbXG4gICAgLi4ucGFyYW1JZHMubWFwKChpZCwgaSkgPT4gW2lkLCBpXSksXG4gICAgLi4ubG9jYWxzLm1hcCgoW2lkXSwgaSkgPT4gW2lkLCBmdW5jLnBhcmFtcy5sZW5ndGggKyBpXSksXG4gIF0pXG4gIHJldHVybiB7IGZ1bmMsIGJ1aWx0LCBsb2NhbHMsIGxvY2FsSW5kZXhlcywgZnVuY3Rpb25zOiBbLi4uZnVuY3Rpb25zXSwgYXJyYXlzOiBbLi4uYXJyYXlzXSwgZ2xvYmFsczogWy4uLmdsb2JhbHNdLCB0cmFwczogWy4uLnRyYXBzXSwgbG9nczogWy4uLmxvZ3NdIH1cbn1cblxuY29uc3QgYnVpbGRSZWZlcmVuY2VkRnVuY3Rpb25zID0gKHJvb3RzOiBBbnlGdW5jW10pID0+IHtcbiAgY29uc3QgYnVpbHQgPSBuZXcgTWFwPEFueUZ1bmMsIEJ1aWx0RnVuYz4oKVxuICBjb25zdCB2aXNpdCA9IChmdW5jOiBBbnlGdW5jKSA9PiB7XG4gICAgaWYgKGJ1aWx0LmhhcyhmdW5jKSkgcmV0dXJuXG4gICAgY29uc3QgZW50cnkgPSBidWlsZEZ1bmMoZnVuYylcbiAgICBidWlsdC5zZXQoZnVuYywgZW50cnkpXG4gICAgZW50cnkuZnVuY3Rpb25zLmZvckVhY2godmlzaXQpXG4gIH1cbiAgcm9vdHMuZm9yRWFjaCh2aXNpdClcbiAgcmV0dXJuIFsuLi5idWlsdC52YWx1ZXMoKV1cbn1cblxuZXhwb3J0IGNvbnN0IGFuYWx5emVNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PiB7XG4gIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhtb2QpXG4gIGNvbnN0IGZ1bmNzID0gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImZ1bmNcIikpIGFzIEZ1bmNEZWZzPFQ+XG4gIGNvbnN0IGFycmF5cyA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzLmZpbHRlcigoWywgdl0pID0+IHYua2luZCA9PT0gXCJhcnJheVwiKSkgYXMgQXJyYXlEZWZzPFQ+XG4gIGNvbnN0IGZFbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZnVuY3MpIGFzIFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGNvbnN0IGJ1aWx0RnVuY3MgPSBidWlsZFJlZmVyZW5jZWRGdW5jdGlvbnMoZkVudHJpZXMubWFwKChbLCBmdW5jXSkgPT4gZnVuYykpXG4gIGNvbnN0IGZpeCA9IG5ldyBNYXAoYnVpbHRGdW5jcy5tYXAoKHsgZnVuYyB9LCBpKSA9PiBbZnVuYywgaV0pKVxuICBjb25zdCBhbGxBcnJheXMgPSBbLi4ubmV3IFNldChbLi4uYnVpbHRGdW5jcy5mbGF0TWFwKGZ1bmMgPT4gZnVuYy5hcnJheXMpLCAuLi5PYmplY3QudmFsdWVzKGFycmF5cykgYXMgQW55QXJyYXlbXV0pXVxuICBjb25zdCBhbGxHbG9iYWxzID0gWy4uLm5ldyBTZXQoWy4uLmJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMuZ2xvYmFscyksIC4uLmVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImdsb2JhbC5nZXRcIikubWFwKChbLCB2XSkgPT4gdiBhcyBBbnlHbG9iYWwpXSldXG4gIGNvbnN0IGdsb2JhbHMgPSBuZXcgTWFwKGFsbEdsb2JhbHMubWFwKCh2YWx1ZSwgaSkgPT4gW3ZhbHVlLCBpXSkpXG4gIGNvbnN0IHsgbGF5b3V0cywgYnl0ZXMgfSA9IGFycmF5TGF5b3V0cyhhbGxBcnJheXMpXG4gIGNvbnN0IHRyYXBNZXNzYWdlcyA9IFsuLi5uZXcgU2V0KGJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMudHJhcHMpKV1cbiAgY29uc3QgbG9nTWVzc2FnZXMgPSBbLi4ubmV3IFNldChidWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmxvZ3MpKV1cbiAgcmV0dXJuIHsgZnVuY3MsIGFycmF5cywgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgZ2xvYmFscywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXM6IE1hdGgubWF4KDEsIE1hdGguY2VpbChieXRlcyAvIDY1NTM2KSkgfSBhcyBNb2R1bGVBbmFseXNpczxUPlxufVxuIiwKICAgICJpbXBvcnQge1xuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUV4cHIsIHR5cGUgQW55RnVuYywgdHlwZSBBbnlHbG9iYWwsIHR5cGUgQXJpdGhtZXRpY09wLCB0eXBlIEJpdE9wLCB0eXBlIENtcE9wLCB0eXBlIEV4cHIsXG4gIHR5cGUgTWVtb3J5VHlwZSwgdHlwZSBNb2R1bGVEZWYsIHR5cGUgTnVtVHlwZSwgdHlwZSBSZW1haW5kZXJPcCwgdHlwZSBTdG10LFxufSBmcm9tIFwiLi9hc3RcIlxuaW1wb3J0IHsgdHlwZSBBcnJheUxheW91dCwgdHlwZSBNb2R1bGVBbmFseXNpcyB9IGZyb20gXCIuL2FuYWx5emVcIlxuXG5jb25zdCBtYWdpYyA9IFsweDAwLCAweDYxLCAweDczLCAweDZkLCAweDAxLCAweDAwLCAweDAwLCAweDAwXVxuY29uc3QgcmVzdWx0VHlwZSA9IChyZXN1bHQ6IEFueUZ1bmNbXCJyZXN1bHRcIl0pID0+XG4gIHR5cGVvZiByZXN1bHQgPT09IFwib2JqZWN0XCIgPyByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiIDogcmVzdWx0XG5cbmNvbnN0IG51bWJlckJhc2UgPSB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+XG5jb25zdCBvcGNvZGUgPSAob3A6IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3AgfCBDbXBPcCwgdHlwZTogTnVtVHlwZSkgPT4ge1xuICBjb25zdCBhcml0aG1ldGljID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdLmluZGV4T2Yob3ApXG4gIGlmIChhcml0aG1ldGljID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgYXJpdGhtZXRpY1xuICBjb25zdCBpbnRlZ2VyID0gW1wibW9kXCIsIFwidW1vZFwiLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwiXCIsIFwic2hyXCJdLmluZGV4T2Yob3ApXG4gIGlmIChpbnRlZ2VyID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgNSArIGludGVnZXJcbiAgcmV0dXJuICh7IGkzMjogMHg0NiwgaTY0OiAweDUxLCBmMzI6IDB4NWIsIGY2NDogMHg2MSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+KVt0eXBlXVxuICAgICsgKG9wID09PSBcImVxXCIgPyAwIDogb3AgPT09IFwibHRcIiA/IDIgOiB0eXBlWzBdID09PSBcImlcIiA/IDQgOiAzKVxufVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgbG9hZDogeyBpMzI6IDB4MjgsIGk2NDogMHgyOSwgZjMyOiAweDJhLCBmNjQ6IDB4MmIsIGk4OiAweDJjLCB1ODogMHgyZCwgaTE2OiAweDJlLCB1MTY6IDB4MmYgfSBhcyBSZWNvcmQ8TWVtb3J5VHlwZSwgbnVtYmVyPixcbiAgc3RvcmU6IHsgaTMyOiAweDM2LCBpNjQ6IDB4MzcsIGYzMjogMHgzOCwgZjY0OiAweDM5LCBpODogMHgzYSwgdTg6IDB4M2EsIGkxNjogMHgzYiwgdTE2OiAweDNiIH0gYXMgUmVjb3JkPE1lbW9yeVR5cGUsIG51bWJlcj4sXG4gIGFsaWduOiB7IGk4OiAwLCB1ODogMCwgaTE2OiAxLCB1MTY6IDEsIGkzMjogMiwgZjMyOiAyLCBpNjQ6IDMsIGY2NDogMyB9IGFzIFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+LFxuICB6ZXJvOiB7IGkzMjogWzB4NDEsIDBdLCBpNjQ6IFsweDQyLCAwXSwgZjMyOiBbMHg0MywgMCwgMCwgMCwgMF0sIGY2NDogWzB4NDQsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcltdPixcbn1cblxuY29uc3QgdTMyID0gKG46IG51bWJlcikgPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdW5zaWduZWQgaW50ZWdlciwgZ290ICR7bn1gKVxuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgZG8ge1xuICAgIGxldCBieXRlID0gbiAmIDB4N2ZcbiAgICBuID4+Pj0gN1xuICAgIGlmIChuKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICB9IHdoaWxlIChuKVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IHNOID0gKHZhbHVlOiBudW1iZXIgfCBiaWdpbnQsIGJpdHM6IDMyIHwgNjQpID0+IHtcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGxldCBuID0gYml0cyA9PT0gMzIgPyBCaWdJbnQoKHZhbHVlIGFzIG51bWJlcikgfCAwKSA6IEJpZ0ludC5hc0ludE4oNjQsIHZhbHVlIGFzIGJpZ2ludClcbiAgZm9yICg7Oykge1xuICAgIGxldCBieXRlID0gTnVtYmVyKG4gJiAweDdmbilcbiAgICBuID4+PSA3blxuICAgIGNvbnN0IGRvbmUgPSAobiA9PT0gMG4gJiYgKGJ5dGUgJiAweDQwKSA9PT0gMCkgfHwgKG4gPT09IC0xbiAmJiAoYnl0ZSAmIDB4NDApICE9PSAwKVxuICAgIGlmICghZG9uZSkgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgICBpZiAoZG9uZSkgcmV0dXJuIG91dFxuICB9XG59XG5cbmNvbnN0IGZOID0gKHZhbHVlOiBudW1iZXIsIGJ5dGVzOiA0IHwgOCkgPT4ge1xuICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShieXRlcylcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhvdXQuYnVmZmVyKVxuICBieXRlcyA9PT0gNCA/IHZpZXcuc2V0RmxvYXQzMigwLCB2YWx1ZSwgdHJ1ZSkgOiB2aWV3LnNldEZsb2F0NjQoMCwgdmFsdWUsIHRydWUpXG4gIHJldHVybiBbLi4ub3V0XVxufVxuXG5jb25zdCBnbG9iYWxJbml0ID0gKHZhbHVlOiBBbnlHbG9iYWwpID0+XG4gIHZhbHVlLnR5cGUgPT09IFwiaTMyXCIgPyBbMHg0MSwgLi4uc04odmFsdWUuaW5pdGlhbCBhcyBudW1iZXIsIDMyKV0gOlxuICB2YWx1ZS50eXBlID09PSBcImk2NFwiID8gWzB4NDIsIC4uLnNOKHZhbHVlLmluaXRpYWwsIDY0KV0gOlxuICB2YWx1ZS50eXBlID09PSBcImYzMlwiID8gWzB4NDMsIC4uLmZOKHZhbHVlLmluaXRpYWwgYXMgbnVtYmVyLCA0KV0gOlxuICBbMHg0NCwgLi4uZk4odmFsdWUuaW5pdGlhbCBhcyBudW1iZXIsIDgpXVxuXG5jb25zdCBzdHIgPSAoczogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpXG4gIHJldHVybiBbLi4udTMyKGJ5dGVzLmxlbmd0aCksIC4uLmJ5dGVzXVxufVxuXG5jb25zdCBzZWN0aW9uID0gKGlkOiBudW1iZXIsIHBheWxvYWQ6IG51bWJlcltdKSA9PiBbaWQsIC4uLnUzMihwYXlsb2FkLmxlbmd0aCksIC4uLnBheWxvYWRdXG5jb25zdCBmbGF0TWFwID0gPFQsIFI+KHhzOiBUW10sIGZuOiAoeDogVCkgPT4gUltdKSA9PiB4cy5mbGF0TWFwKGZuKVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5cbmNvbnN0IGFkZHIgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZSA9IGxheW91dC5lbGVtZW50U2l6ZSwgZmllbGRPZmZzZXQgPSAwKSA9PlxuICBpbmRleC5tdWwoc3RyaWRlKS5hZGQobGF5b3V0Lm9mZnNldCArIGZpZWxkT2Zmc2V0KVxuY29uc3QgbWVtYXJnID0gKHR5cGU6IE1lbW9yeVR5cGUsIG9mZnNldCA9IDApID0+IFsuLi51MzIoY29kZXMuYWxpZ25bdHlwZV0pLCAuLi51MzIob2Zmc2V0KV1cbmNvbnN0IGNvbnN0STMyID0gKGU6IEV4cHI8XCJpMzJcIj4pID0+IGUua2luZCA9PT0gXCJjb25zdFwiID8gZS52YWx1ZSA6IG51bGxcbmNvbnN0IGNoZWNrQXJyYXlCb3VuZHMgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgbiA9IGNvbnN0STMyKGluZGV4KVxuICBpZiAobiA9PSBudWxsKSByZXR1cm5cbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pIHx8IG4gPCAwIHx8IG4gPj0gbGF5b3V0Lmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGBBcnJheSBpbmRleCAke259IG91dCBvZiBib3VuZHMgZm9yIGxlbmd0aCAke2xheW91dC5sZW5ndGh9YClcbn1cbmNvbnN0IGNoZWNrTW92ZUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCB0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgdmFsdWVzID0gW2NvbnN0STMyKHRhcmdldCksIGNvbnN0STMyKHNvdXJjZSksIGNvbnN0STMyKGNvdW50KV1cbiAgaWYgKHZhbHVlcy5zb21lKHZhbHVlID0+IHZhbHVlID09IG51bGwpKSByZXR1cm5cbiAgY29uc3QgW3RvLCBmcm9tLCBzaXplXSA9IHZhbHVlcyBhcyBudW1iZXJbXVxuICBpZiAodG8hIDwgMCB8fCBmcm9tISA8IDAgfHwgc2l6ZSEgPCAwIHx8IHRvISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aCB8fCBmcm9tISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IG1vdmUgKCR7dG99LCAke2Zyb219LCAke3NpemV9KSBvdXQgb2YgYm91bmRzIGZvciBsZW5ndGggJHtsYXlvdXQubGVuZ3RofWApXG59XG5cbmNvbnN0IG1ha2VDb21waWxlciA9IChcbiAgZml4OiBNYXA8QW55RnVuYywgbnVtYmVyPiwgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LCBhcnJheXM6IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+LFxuICB0cmFwczogTWFwPHN0cmluZywgbnVtYmVyPiwgbG9nczogTWFwPHN0cmluZywgbnVtYmVyPiwgZ2xvYmFsczogTWFwPEFueUdsb2JhbCwgbnVtYmVyPixcbikgPT4ge1xuY29uc3QgY29tcGlsZUV4cHIgPSAoZTogQW55RXhwcik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjpcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTMyXCIpIHJldHVybiBbMHg0MSwgLi4uc04oZS52YWx1ZSBhcyBudW1iZXIsIDMyKV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTY0XCIpIHJldHVybiBbMHg0MiwgLi4uc04oZS52YWx1ZSwgNjQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmMzJcIikgcmV0dXJuIFsweDQzLCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgNCldXG4gICAgICBpZiAoZS50eXBlID09PSBcImY2NFwiKSByZXR1cm4gWzB4NDQsIC4uLmZOKGUudmFsdWUgYXMgbnVtYmVyLCA4KV1cbiAgICAgIHJldHVybiBkaWUoZSlcbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6XG4gICAgICByZXR1cm4gWzB4MjAsIC4uLnUzMihsaXhbZS5sb2NhbF0hKV1cbiAgICBjYXNlIFwiZ2xvYmFsLmdldFwiOlxuICAgICAgcmV0dXJuIFsweDIzLCAuLi51MzIoZ2xvYmFscy5nZXQoZSkhKV1cbiAgICBjYXNlIFwiYmluXCI6IHtcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5sZWZ0KSwgLi4uY29tcGlsZUV4cHIoZS5yaWdodCksIG9wY29kZShlLm9wLCBlLnR5cGUpXVxuICAgIH1cbiAgICBjYXNlIFwiY21wXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQpLCBvcGNvZGUoZS5vcCwgZS5pbnB1dFR5cGUpXVxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICByZXR1cm4gWy4uLmZsYXRNYXAoZS5hcmdzLCBjb21waWxlRXhwciksIDB4MTAsIC4uLnUzMihmaXguZ2V0KGUudGFyZ2V0KSEgKyAyKV1cbiAgICBjYXNlIFwiY2FzdFwiOiB7XG4gICAgICBjb25zdCBmcm9tID0gZS5pbnB1dFR5cGUgYXMgTnVtVHlwZVxuICAgICAgY29uc3QgdG8gPSBlLnR5cGUgYXMgTnVtVHlwZVxuICAgICAgbGV0IG9wY29kZTogbnVtYmVyIHwgdW5kZWZpbmVkXG4gICAgICBpZiAodG8gPT09IFwiaTMyXCIgJiYgZnJvbSA9PT0gXCJpNjRcIikgb3Bjb2RlID0gMHhhN1xuICAgICAgaWYgKHRvID09PSBcImkzMlwiICYmIGZyb20gPT09IFwiZjMyXCIpIG9wY29kZSA9IDB4YThcbiAgICAgIGlmICh0byA9PT0gXCJpMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGFhXG4gICAgICBpZiAodG8gPT09IFwiaTY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gZS51bnNpZ25lZCA/IDB4YWQgOiAweGFjXG4gICAgICBpZiAodG8gPT09IFwiZjMyXCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiMlxuICAgICAgaWYgKHRvID09PSBcImYzMlwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjRcbiAgICAgIGlmICh0byA9PT0gXCJmMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGI2XG4gICAgICBpZiAodG8gPT09IFwiZjY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiN1xuICAgICAgaWYgKHRvID09PSBcImY2NFwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjlcbiAgICAgIGlmICh0byA9PT0gXCJmNjRcIiAmJiBmcm9tID09PSBcImYzMlwiKSBvcGNvZGUgPSAweGJiXG4gICAgICBpZiAob3Bjb2RlID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY2FzdCAke2Zyb219IC0+ICR7dG99YClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS52YWx1ZSksIG9wY29kZV1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUuY29uZCksIDB4MDQsIGNvZGVzLnR5cGVbZS50eXBlIGFzIE51bVR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4pLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UpLCAweDBiXVxuICAgIGNhc2UgXCJsb2FkXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQoZS5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtlLmFycmF5fWApXG4gICAgICBjaGVja0FycmF5Qm91bmRzKGxheW91dCwgZS5pbmRleClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIGUuaW5kZXgsIGUuc3RyaWRlLCBlLm9mZnNldCkpLCBjb2Rlcy5sb2FkW2Uuc3RvcmFnZSBhcyBNZW1vcnlUeXBlXSwgLi4ubWVtYXJnKGUuc3RvcmFnZSBhcyBNZW1vcnlUeXBlKV1cbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUoZSlcbiAgfVxufVxuXG5jb25zdCBjb21waWxlU3RtdCA9IChzOiBTdG10KTogbnVtYmVyW10gPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MjEsIC4uLnUzMihsaXhbcy5sb2NhbF0hKV1cbiAgICBjYXNlIFwiZ2xvYmFsLnNldFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgMHgyNCwgLi4udTMyKGdsb2JhbHMuZ2V0KHMuZ2xvYmFsKSEpXVxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBhcnJheXMuZ2V0KHMuYXJyYXkpXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tBcnJheUJvdW5kcyhsYXlvdXQsIHMuaW5kZXgpXG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLmluZGV4LCBzLnN0cmlkZSwgcy5vZmZzZXQpKSwgLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIGNvZGVzLnN0b3JlW3MudHlwZV0sIC4uLm1lbWFyZyhzLnR5cGUpXVxuICAgIH1cbiAgICBjYXNlIFwiYXJyYXkubW92ZVwiOiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBhcnJheXMuZ2V0KHMuYXJyYXkpXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tNb3ZlQm91bmRzKGxheW91dCwgcy50YXJnZXQsIHMuc291cmNlLCBzLmNvdW50KVxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIHMudGFyZ2V0KSksXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLnNvdXJjZSkpLFxuICAgICAgICAuLi5jb21waWxlRXhwcihzLmNvdW50Lm11bChsYXlvdXQuZWxlbWVudFNpemUpKSxcbiAgICAgICAgMHhmYywgMHgwYSwgMHgwMCwgMHgwMCxcbiAgICAgIF1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMuY29uZCksIDB4MDQsIDB4NDAsIC4uLmZsYXRNYXAocy50aGVuLCBjb21waWxlU3RtdCksIC4uLihzLmVsc2UubGVuZ3RoID8gWzB4MDUsIC4uLmZsYXRNYXAocy5lbHNlLCBjb21waWxlU3RtdCldIDogW10pLCAweDBiXVxuICAgIGNhc2UgXCJsb29wXCI6XG4gICAgICByZXR1cm4gWzB4MDIsIDB4NDAsIDB4MDMsIDB4NDAsIC4uLmNvbXBpbGVFeHByKHMuY29uZCksIDB4NDUsIDB4MGQsIC4uLnUzMigxKSwgLi4uZmxhdE1hcChzLmJvZHksIGNvbXBpbGVTdG10KSwgMHgwYywgLi4udTMyKDApLCAweDBiLCAweDBiXVxuICAgIGNhc2UgXCJmb3JcIjoge1xuICAgICAgY29uc3QgaW5kZXggPSBsaXhbcy5sb2NhbF0hXG4gICAgICByZXR1cm4gW1xuICAgICAgICAuLi5jb21waWxlRXhwcihzLnN0YXJ0KSwgMHgyMSwgLi4udTMyKGluZGV4KSxcbiAgICAgICAgMHgwMiwgMHg0MCxcbiAgICAgICAgMHgwMywgMHg0MCxcbiAgICAgICAgMHgyMCwgLi4udTMyKGluZGV4KSwgLi4uY29tcGlsZUV4cHIocy5lbmQpLCAweDQ4LCAweDQ1LCAweDBkLCAuLi51MzIoMSksXG4gICAgICAgIC4uLmZsYXRNYXAocy5ib2R5LCBjb21waWxlU3RtdCksXG4gICAgICAgIDB4MjAsIC4uLnUzMihpbmRleCksIDB4NDEsIDB4MDEsIDB4NmEsIDB4MjEsIC4uLnUzMihpbmRleCksXG4gICAgICAgIDB4MGMsIC4uLnUzMigwKSxcbiAgICAgICAgMHgwYiwgMHgwYixcbiAgICAgIF1cbiAgICB9XG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgcmV0dXJuIFsuLi4ocy52YWx1ZSA/IGNvbXBpbGVFeHByKHMudmFsdWUpIDogW10pLCAweDBmXVxuICAgIGNhc2UgXCJ0cmFwXCI6XG4gICAgICByZXR1cm4gWzB4NDEsIC4uLnNOKHRyYXBzLmdldChzLm1lc3NhZ2UpISwgMzIpLCAweDEwLCAweDAwXVxuICAgIGNhc2UgXCJsb2dcIjpcbiAgICAgIHJldHVybiBbMHg0MSwgLi4uc04obG9ncy5nZXQocy5tZXNzYWdlKSEsIDMyKSwgLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MTAsIDB4MDFdXG4gICAgY2FzZSBcImNhbGwudm9pZFwiOlxuICAgICAgcmV0dXJuIFsuLi5mbGF0TWFwKHMuYXJncywgY29tcGlsZUV4cHIpLCAweDEwLCAuLi51MzIoZml4LmdldChzLnRhcmdldCkhICsgMildXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUocylcbiAgfVxufVxucmV0dXJuIHsgZXhwcjogY29tcGlsZUV4cHIsIHN0bXQ6IGNvbXBpbGVTdG10IH1cbn1cblxuXG5leHBvcnQgY29uc3QgZW1pdE1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPih7IGZFbnRyaWVzLCBidWlsdEZ1bmNzLCBmaXgsIGxheW91dHMsIGdsb2JhbHMsIHRyYXBNZXNzYWdlcywgbG9nTWVzc2FnZXMsIHBhZ2VzIH06IE1vZHVsZUFuYWx5c2lzPFQ+KSA9PiB7XG4gIGNvbnN0IHRyYXBzID0gbmV3IE1hcCh0cmFwTWVzc2FnZXMubWFwKChtZXNzYWdlLCBpZCkgPT4gW21lc3NhZ2UsIGlkXSkpXG4gIGNvbnN0IGxvZ3MgPSBuZXcgTWFwKGxvZ01lc3NhZ2VzLm1hcCgobWVzc2FnZSwgaWQpID0+IFttZXNzYWdlLCBpZF0pKVxuICBjb25zdCBmdW5jdGlvblNlY3Rpb24gPSBidWlsdEZ1bmNzLmZsYXRNYXAoKF8sIGkpID0+IHUzMihpICsgMikpXG4gIGNvbnN0IGV4cG9ydFNlY3Rpb24gPSBmRW50cmllcy5mbGF0TWFwKChbbmFtZSwgZnVuY10pID0+IFsuLi5zdHIobmFtZSksIDB4MDAsIC4uLnUzMihmaXguZ2V0KGZ1bmMpISArIDIpXSlcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFtcbiAgICAuLi5tYWdpYyxcbiAgICAuLi5zZWN0aW9uKDB4MDEsIFsuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGggKyAyKSxcbiAgICAgIDB4NjAsIDB4MDEsIGNvZGVzLnR5cGUuaTMyLCAweDAwLFxuICAgICAgMHg2MCwgMHgwMiwgY29kZXMudHlwZS5pMzIsIGNvZGVzLnR5cGUuaTMyLCAweDAwLFxuICAgICAgLi4uZmxhdE1hcChidWlsdEZ1bmNzLCAoeyBmdW5jIH0pID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzdWx0VHlwZShmdW5jLnJlc3VsdClcbiAgICAgICAgcmV0dXJuIFsweDYwLCAuLi51MzIoZnVuYy5wYXJhbXMubGVuZ3RoKSwgLi4uZnVuYy5wYXJhbXMubWFwKHQgPT4gY29kZXMudHlwZVt0XSksIC4uLihyZXN1bHQgPT09IFwidm9pZFwiID8gWzB4MDBdIDogWzB4MDEsIGNvZGVzLnR5cGVbcmVzdWx0XV0pXVxuICAgICAgfSldKSxcbiAgICAuLi5zZWN0aW9uKDB4MDIsIFtcbiAgICAgIDB4MDMsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJ0cmFwXCIpLFxuICAgICAgMHgwMCxcbiAgICAgIDB4MDAsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJsb2dcIiksXG4gICAgICAweDAwLFxuICAgICAgMHgwMSxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcIm1lbW9yeVwiKSxcbiAgICAgIDB4MDIsXG4gICAgICAweDAzLFxuICAgICAgLi4udTMyKHBhZ2VzKSxcbiAgICAgIC4uLnUzMihwYWdlcyksXG4gICAgXSksXG4gICAgLi4uc2VjdGlvbigweDAzLCBbLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSwgLi4uZnVuY3Rpb25TZWN0aW9uXSksXG4gICAgLi4uKGdsb2JhbHMuc2l6ZSA/IHNlY3Rpb24oMHgwNiwgWy4uLnUzMihnbG9iYWxzLnNpemUpLCAuLi5bLi4uZ2xvYmFsc10uZmxhdE1hcCgoW3ZhbHVlXSkgPT4gW2NvZGVzLnR5cGVbdmFsdWUudHlwZV0sIDB4MDEsIC4uLmdsb2JhbEluaXQodmFsdWUpLCAweDBiXSldKSA6IFtdKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZXhwb3J0U2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgW1xuICAgICAgLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYywgYnVpbHQsIGxvY2FscywgbG9jYWxJbmRleGVzIH0pID0+IHtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBtYWtlQ29tcGlsZXIoZml4LCBsb2NhbEluZGV4ZXMsIGxheW91dHMsIHRyYXBzLCBsb2dzLCBnbG9iYWxzKVxuICAgICAgICBjb25zdCBkZWNscyA9IFsuLi51MzIobG9jYWxzLmxlbmd0aCksIC4uLmZsYXRNYXAobG9jYWxzLCAoWywgdHlwZV0pID0+IFsuLi51MzIoMSksIGNvZGVzLnR5cGVbdHlwZV1dKV1cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzdWx0VHlwZShmdW5jLnJlc3VsdClcbiAgICAgICAgY29uc3QgY29kZSA9IFsuLi5mbGF0TWFwKGJ1aWx0LCBzID0+IGNvbXBpbGVyLnN0bXQocykpLCAuLi4ocmVzdWx0ID09PSBcInZvaWRcIiA/IFtdIDogY29kZXMuemVyb1tyZXN1bHRdKV1cbiAgICAgICAgY29uc3QgYm9keSA9IFsuLi5kZWNscywgLi4uY29kZSwgMHgwYl1cbiAgICAgICAgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XVxuICAgICAgfSksXG4gICAgXSksXG4gIF0pXG59XG4iLAogICAgImV4cG9ydCB7XG4gIGFycmF5LCBib3VuZHNDaGVjaywgZXhwLCBmMzIsIGY2NCwgZm4sIGZvcl8sIGdsb2JhbCwgaTMyLCBpNjQsIGk2NHUsXG4gIGlmRWxzZSwgbG9nLCByZXR1cm5fLCBzdHJ1Y3QsIHRyYXAsIHZhcmlhYmxlLCB3aGVuLCB3aGlsZV8sXG59IGZyb20gXCIuL2FzdFwiXG5leHBvcnQgdHlwZSB7XG4gIEFueUFycmF5LCBBbnlGdW5jLCBBcmdzVmFsLCBBcnJheUhhbmRsZSwgQ29tcGlsZVJlc3VsdCwgRFR5cGUsIEV4cHIsIEV4cHJMaWtlLFxuICBHbG9iYWxWYWx1ZSwgSlNTdHJ1Y3QsIExvY2FsVmFyLCBNb2R1bGVEZWYsIE11dGFibGVTdHJ1Y3QsIE11dGFibGVWYWx1ZSxcbiAgTnVtVHlwZSwgU3RydWN0VHlwZSwgVmFsdWUsXG59IGZyb20gXCIuL2FzdFwiXG5leHBvcnQgeyBmb3JtYXRNb2R1bGUgfSBmcm9tIFwiLi9mb3JtYXRcIlxuXG5pbXBvcnQgeyBhbmFseXplTW9kdWxlIH0gZnJvbSBcIi4vYW5hbHl6ZVwiXG5pbXBvcnQgeyBlbWl0TW9kdWxlIH0gZnJvbSBcIi4vY29kZWdlblwiXG5pbXBvcnQgdHlwZSB7XG4gIEFueUFycmF5LCBBbnlGdW5jLCBDb21waWxlUmVzdWx0LCBKU1N0cnVjdCwgTW9kdWxlRGVmLCBTdHJ1Y3RGaWVsZHMsIFN0cnVjdFR5cGUsXG59IGZyb20gXCIuL2FzdFwiXG5cbmNvbnN0IGFycmF5Q3RvcnMgPSB7XG4gIGk4OiBJbnQ4QXJyYXksIHU4OiBVaW50OEFycmF5LCBpMTY6IEludDE2QXJyYXksIHUxNjogVWludDE2QXJyYXksXG4gIGkzMjogSW50MzJBcnJheSwgaTY0OiBCaWdJbnQ2NEFycmF5LCBmMzI6IEZsb2F0MzJBcnJheSwgZjY0OiBGbG9hdDY0QXJyYXksXG4gIHN1ODogVWludDhBcnJheSwgc3UxNjogVWludDE2QXJyYXksIHNpMzI6IFVpbnQzMkFycmF5LCBzaTY0OiBCaWdVaW50NjRBcnJheSxcbn1cblxuZXhwb3J0IGNvbnN0IGRlY29kZVN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCByYXc6IG51bWJlciB8IGJpZ2ludCk6IEpTU3RydWN0PEY+ID0+IHtcbiAgY29uc3QgcGFja2VkID0gQmlnSW50LmFzVWludE4odHlwZS5zaXplICogOCwgQmlnSW50KHJhdykpXG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXModHlwZS5sYXlvdXQpLm1hcCgoW25hbWUsIGZpZWxkXSkgPT4ge1xuICAgIGNvbnN0IG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgbGV0IHZhbHVlID0gKHBhY2tlZCA+PiBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkgJiBtYXNrXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgdmFsdWUgJiAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMgLSAxKSkpXG4gICAgICB2YWx1ZSAtPSAxbiA8PCBCaWdJbnQoZmllbGQuYml0cylcbiAgICByZXR1cm4gW25hbWUsIGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyB2YWx1ZSA6IE51bWJlcih2YWx1ZSldXG4gIH0pKSBhcyBKU1N0cnVjdDxGPlxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZSA9IGFzeW5jIDxUIGV4dGVuZHMgTW9kdWxlRGVmPihcbiAgbW9kOiBULFxuKTogUHJvbWlzZTxDb21waWxlUmVzdWx0PFQ+PiA9PiB7XG4gIGNvbnN0IGFuYWx5c2lzID0gYW5hbHl6ZU1vZHVsZShtb2QpXG4gIGNvbnN0IG1lbW9yeSA9IG5ldyBXZWJBc3NlbWJseS5NZW1vcnkoe1xuICAgIGluaXRpYWw6IGFuYWx5c2lzLnBhZ2VzLFxuICAgIG1heGltdW06IGFuYWx5c2lzLnBhZ2VzLFxuICAgIHNoYXJlZDogdHJ1ZSxcbiAgfSlcbiAgY29uc3QgY29tcGlsZWQgPSBhd2FpdCBXZWJBc3NlbWJseS5jb21waWxlKGVtaXRNb2R1bGUoYW5hbHlzaXMpLmJ1ZmZlcilcbiAgY29uc3QgdHJhcCA9IChpZDogbnVtYmVyKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYW5hbHlzaXMudHJhcE1lc3NhZ2VzW2lkXSA/PyBgVW5rbm93biBXQVNNIHRyYXAgJHtpZH1gKSB9XG4gIGNvbnN0IGxvZyA9IChpZDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiBjb25zb2xlLmxvZyhhbmFseXNpcy5sb2dNZXNzYWdlc1tpZF0gPz8gYFdBU00gbG9nICR7aWR9YCwgdmFsdWUpXG4gIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoY29tcGlsZWQsIHsgZW52OiB7IG1lbW9yeSwgdHJhcCwgbG9nIH0gfSlcbiAgY29uc3QgZnVuY0VudHJpZXMgPSBPYmplY3QuZW50cmllcyhhbmFseXNpcy5mdW5jcykgYXMgW3N0cmluZywgQW55RnVuY11bXVxuICBjb25zdCBqc0Z1bmNzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LCByZXN1bHRTdHJ1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBTdHJ1Y3RUeXBlPGFueT4+ID0ge31cbiAgZm9yIChjb25zdCBbbmFtZSwgZnVuY10gb2YgZnVuY0VudHJpZXMpIHtcbiAgICBjb25zdCB3YXNtRnVuYyA9IGluc3RhbmNlLmV4cG9ydHNbbmFtZV0gYXMgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gbnVtYmVyIHwgYmlnaW50XG4gICAganNGdW5jc1tuYW1lXSA9IHdhc21GdW5jXG4gICAgaWYgKHR5cGVvZiBmdW5jLnJlc3VsdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmVzdWx0U3RydWN0c1tuYW1lXSA9IGZ1bmMucmVzdWx0XG4gICAgICBqc0Z1bmNzW25hbWVdID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gZGVjb2RlU3RydWN0KGZ1bmMucmVzdWx0IGFzIFN0cnVjdFR5cGU8YW55Piwgd2FzbUZ1bmMoLi4uYXJncykpXG4gICAgfVxuICB9XG4gIGNvbnN0IGpzQXJyYXlzID0gKE9iamVjdC5lbnRyaWVzKGFuYWx5c2lzLmFycmF5cykgYXMgW3N0cmluZywgQW55QXJyYXldW10pLm1hcCgoW25hbWUsIGFycl0pID0+IHtcbiAgICBjb25zdCBsYXlvdXQgPSBhbmFseXNpcy5sYXlvdXRzLmdldChhcnIpIVxuICAgIGNvbnN0IGtleSA9IHR5cGVvZiBhcnIudHlwZSA9PT0gXCJzdHJpbmdcIiA/IGFyci50eXBlIDogYHMke2Fyci50eXBlLnN0b3JhZ2V9YFxuICAgIGNvbnN0IEN0b3IgPSBhcnJheUN0b3JzW2tleSBhcyBrZXlvZiB0eXBlb2YgYXJyYXlDdG9yc11cbiAgICByZXR1cm4gW25hbWUsIG5ldyBDdG9yKG1lbW9yeS5idWZmZXIsIGxheW91dC5vZmZzZXQsIGFyci5sZW5ndGgpXSBhcyBjb25zdFxuICB9KVxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihqc0Z1bmNzLCBPYmplY3QuZnJvbUVudHJpZXMoanNBcnJheXMpLCB7XG4gICAgbW9kOiBjb21waWxlZCwgbWVtb3J5LCByZXN1bHRTdHJ1Y3RzLFxuICAgIHRyYXBNZXNzYWdlczogYW5hbHlzaXMudHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlczogYW5hbHlzaXMubG9nTWVzc2FnZXMsXG4gIH0pIGFzIENvbXBpbGVSZXN1bHQ8VD5cbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgYXJyYXksIGNvbXBpbGUsIGV4cCwgZjMyLCBmbiwgZm9yXywgZ2xvYmFsLCBpMzIsIGk2NHUsIGlmRWxzZSwgbG9nLCByZXR1cm5fLCBzdHJ1Y3QsIHRyYXAsIHZhcmlhYmxlLCB3aGVuLCB0eXBlIEFueUFycmF5LCB0eXBlIEFycmF5SGFuZGxlLCB0eXBlIERUeXBlLCB0eXBlIEV4cHIsIHR5cGUgRXhwckxpa2UgfSBmcm9tIFwiLi4vd2FzbVwiXG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiXG5pbXBvcnQgeyBJTkYsIEtNX0NPU1RfQ0VOVFMsIFJFT1JHX0NPU1RfQ0VOVFMgfSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCJcblxuY29uc3QgVEVNUF9QSEFTRVMgPSAxXzAwMFxuY29uc3QgRU5EX1RFTVBfQ0VOVFMgPSAwXG5cbmV4cG9ydCB0eXBlIFdhc21TZWFyY2hQYXJhbXMgPSB7XG4gIHN0ZXBzOiBudW1iZXJcbiAgc3RhcnRUZW1wZXJhdHVyZTogbnVtYmVyXG4gIG51ZGdlUmFkaXVzOiBudW1iZXJcbiAgYXNzaWduV2VpZ2h0OiBudW1iZXJcbiAgdW5hc3NpZ25XZWlnaHQ6IG51bWJlclxuICBudWRnZVdlaWdodDogbnVtYmVyXG4gIHJlbG9jYXRlV2VpZ2h0OiBudW1iZXJcbiAgcm5nU2VlZDogbnVtYmVyXG59XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0V2FzbVNlYXJjaFBhcmFtczogV2FzbVNlYXJjaFBhcmFtcyA9IHtcbiAgc3RlcHM6IDFfNjAwXzAwMCwgc3RhcnRUZW1wZXJhdHVyZTogMl81MDAsIG51ZGdlUmFkaXVzOiA0LFxuICBhc3NpZ25XZWlnaHQ6IDMsIHVuYXNzaWduV2VpZ2h0OiAxLCBudWRnZVdlaWdodDogMywgcmVsb2NhdGVXZWlnaHQ6IDMsXG4gIHJuZ1NlZWQ6IDEsXG59XG5cbmNvbnN0IERFQlVHID0gZmFsc2VcblxuY29uc3QgZGVidWcgPSAodGFnOiBzdHJpbmcsIHZhbHVlOiBFeHByTGlrZTxcImkzMlwiPik6IHZvaWQgPT4ge1xuICBpZiAoREVCVUcpIGxvZyh0YWcsIHZhbHVlKVxufVxuXG5mdW5jdGlvbiBjaGVja2VkQXJyYXk8VCBleHRlbmRzIERUeXBlPih0eXBlOiBULCBsZW5ndGg6IG51bWJlcik6IEFycmF5SGFuZGxlPFQ+IHtcbiAgY29uc3QgYXJyID0gYXJyYXkodHlwZSwgbGVuZ3RoKSBhcyBBbnlBcnJheVxuICBpZiAoIURFQlVHKSByZXR1cm4gYXJyIGFzIEFycmF5SGFuZGxlPFQ+XG5cbiAgY29uc3QgeyBhdCwgbW92ZSB9ID0gYXJyXG4gIGNvbnN0IGNoZWNrSWR4ID0gZm4oW1wiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAoaSwgbikgPT4ge1xuICAgIHdoZW4oaS5sdCgwKS5vcihuLmx0KDApKS5vcihuLmFkZChpKS5ndChhcnIubGVuZ3RoKSksICgpID0+IHRyYXAoXCJhcnJheSBib3VuZHMgZXhjZWVkZWRcIikpXG4gICAgcmV0dXJuIGlcbiAgfSlcbiAgYXJyLmF0ID0gaW5kZXggPT4gYXQoY2hlY2tJZHguY2FsbChpbmRleCwgMSkpXG4gIGFyci5tb3ZlID0gKHRhcmdldCwgc291cmNlLCBjb3VudCkgPT4ge1xuICAgIG1vdmUoY2hlY2tJZHguY2FsbCh0YXJnZXQsIGNvdW50KSwgY2hlY2tJZHguY2FsbChzb3VyY2UsIGNvdW50KSwgY291bnQpXG4gIH1cbiAgcmV0dXJuIGFyciBhcyBBcnJheUhhbmRsZTxUPlxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYW5uZWFsaW5nV2FzbShwbGFubmVyOiBNb2R1bGUsIG9wdGlvbnM6IFBhcnRpYWw8V2FzbVNlYXJjaFBhcmFtcz4gPSB7fSk6IFByb21pc2U8QW5uZWFsaW5nUmVzdWx0PiB7XG4gIGNvbnN0IHBhcmFtcyA9IHsgLi4uZGVmYXVsdFdhc21TZWFyY2hQYXJhbXMsIC4uLm9wdGlvbnMgfVxuICBjb25zdCBzdGVwc1BlclBoYXNlID0gTWF0aC5mbG9vcihwYXJhbXMuc3RlcHMgLyBURU1QX1BIQVNFUylcbiAgY29uc3QgYXNzaWduRW5kID0gcGFyYW1zLmFzc2lnbldlaWdodFxuICBjb25zdCB1bmFzc2lnbkVuZCA9IGFzc2lnbkVuZCArIHBhcmFtcy51bmFzc2lnbldlaWdodFxuICBjb25zdCBudWRnZUVuZCA9IHVuYXNzaWduRW5kICsgcGFyYW1zLm51ZGdlV2VpZ2h0XG4gIGNvbnN0IHRvdGFsV2VpZ2h0ID0gbnVkZ2VFbmQgKyBwYXJhbXMucmVsb2NhdGVXZWlnaHRcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKHBsYW5uZXIuTlJFUVMgLyBwbGFubmVyLk5UUkFOUyAqIDIuNSAqIDIgKyAxMClcbiAgY29uc3QgTlBPSU5UUyA9IHBsYW5uZXIucm9hZG1hcC5wb2ludHMubGVuZ3RoXG4gIGNvbnN0IFNUT1AgPSBzdHJ1Y3Qoe1xuICAgIHJlcV9pZDogW1widTE2XCIsIDEwXSxcbiAgICBpc19sb2FkOiBbXCJ1OFwiLCAxXSxcbiAgICBkZWNrOiBbXCJ1OFwiLCAxXSxcbiAgfSlcbiAgY29uc3QgUkVRID0gc3RydWN0KHtcbiAgICBzdGFydDogXCJ1MTZcIixcbiAgICBlbmQ6IFwidTE2XCIsXG4gICAgdmFsdWU6IFwidTE2XCIsXG4gICAgZGVhZGxpbmU6IFwidTE2XCIsXG4gIH0pXG5cbiAgY29uc3QgcmFuZFN0YXRlID0gZ2xvYmFsKFwiaTMyXCIsIHBhcmFtcy5ybmdTZWVkIHx8IDEpXG4gIGNvbnN0IGRpc3RzID0gY2hlY2tlZEFycmF5KFwiaTMyXCIsIHBsYW5uZXIuUlNJWkUpXG4gIGNvbnN0IHJlcXVlc3RzID0gY2hlY2tlZEFycmF5KFJFUSwgcGxhbm5lci5OUkVRUylcbiAgY29uc3QgYXNzaWduZWQgPSBjaGVja2VkQXJyYXkoXCJ1OFwiLCBwbGFubmVyLk5SRVFTKVxuICBjb25zdCBzY2hlZHVsZSA9IGNoZWNrZWRBcnJheShTVE9QLCBwbGFubmVyLk5UUkFOUyAqIFRTSVpFKVxuICBjb25zdCBzY2hlZF9zaXplID0gY2hlY2tlZEFycmF5KFwiaTE2XCIsIHBsYW5uZXIuTlRSQU5TKVxuICBjb25zdCByYXRpbmdzID0gY2hlY2tlZEFycmF5KFwiaTMyXCIsIHBsYW5uZXIuTlRSQU5TKVxuICBjb25zdCB0cmFuX3Bvc2l0aW9ucyA9IGNoZWNrZWRBcnJheShcImkxNlwiLCBwbGFubmVyLk5UUkFOUylcblxuICBjb25zdCByYW5kTmV4dCA9IGZuKFtdLCBcImkzMlwiLCAoKSA9PiB7XG4gICAgcmFuZFN0YXRlLnNldChyYW5kU3RhdGUueG9yKHJhbmRTdGF0ZS5zaGwoMTMpKSlcbiAgICByYW5kU3RhdGUuc2V0KHJhbmRTdGF0ZS54b3IocmFuZFN0YXRlLnNocigxNykpKVxuICAgIHJhbmRTdGF0ZS5zZXQocmFuZFN0YXRlLnhvcihyYW5kU3RhdGUuc2hsKDUpKSlcbiAgICByZXR1cm4gcmFuZFN0YXRlXG4gIH0pXG5cbiAgY29uc3QgcmFuZGludCA9IGZuKFtcImkzMlwiXSwgXCJpMzJcIiwgbWF4ID0+XG4gICAgaTMyKGk2NHUocmFuZE5leHQuY2FsbCgpKS5tdWwoaTY0dShtYXgpKS5zaHIoMzJuKSkpXG5cbiAgY29uc3QgYWNjZXB0QW5uZWFsID0gZm4oW1wiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAocHJldmlvdXMsIG5leHQsIHRlbXBlcmF0dXJlKSA9PiB7XG4gICAgd2hlbihwcmV2aW91cy5ndChuZXh0KSwgKCkgPT4ge1xuICAgICAgcmV0dXJuXyhyYW5kaW50LmNhbGwoMV8wMDBfMDAwKS5sdChpMzIoZXhwKFxuICAgICAgICBmMzIobmV4dC5zdWIocHJldmlvdXMpKS5kaXYoZjMyKHRlbXBlcmF0dXJlKSksXG4gICAgICApLm11bCgxXzAwMF8wMDApKSkpXG4gICAgfSlcbiAgICByZXR1cm4gaTMyKDEpXG4gIH0pXG5cbiAgY29uc3Qgcm9hZENvc3QgPSBmbihbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChmcm9tLCB0bykgPT4ge1xuICAgIGNvbnN0IGxvID0gdmFyaWFibGUodG8uYWRkKGZyb20uc3ViKHRvKS5tdWwoZnJvbS5sdCh0bykpKSlcbiAgICBjb25zdCBpbmRleCA9IHZhcmlhYmxlKGZyb20uYWRkKHRvKS5zdWIobG8pLmFkZChsby5tdWwoTlBPSU5UUykpKVxuICAgIGluZGV4LnNldChpbmRleC5hZGQoaW5kZXguZ3QocGxhbm5lci5SU0laRSkubXVsKGkzMihOUE9JTlRTICoqIDIpLnN1YihpbmRleC5tdWwoMikpKSkpXG4gICAgcmV0dXJuIGRpc3RzLmF0KGluZGV4KS5tdWwoZnJvbS5lcSh0bykuZXEoMCkpXG4gIH0pXG5cbiAgY29uc3QgcmF0ZVRyYW4gPSBmbihbXCJpMzJcIl0sIFwiaTMyXCIsIHRyYW4gPT4ge1xuICAgIGNvbnN0IHJld2FyZCA9IHZhcmlhYmxlKDApLCBjb3N0ID0gdmFyaWFibGUoMCksIGVsYXBzZWRNaW51dGVzID0gdmFyaWFibGUoMClcbiAgICBjb25zdCBwb3MgPSB2YXJpYWJsZSh0cmFuX3Bvc2l0aW9ucy5hdCh0cmFuKSlcbiAgICBjb25zdCBvZmZzZXQgPSB0cmFuLm11bChUU0laRSksIHNpemUgPSB2YXJpYWJsZShzY2hlZF9zaXplLmF0KHRyYW4pKVxuICAgIGNvbnN0IGRlY2swID0gdmFyaWFibGUoMCksIGRlY2sxID0gdmFyaWFibGUoMCksIGRlY2tTaXplMCA9IHZhcmlhYmxlKDApLCBkZWNrU2l6ZTEgPSB2YXJpYWJsZSgwKVxuXG4gICAgZm9yXygwLCBzaXplLCBpID0+IHtcbiAgICAgIGNvbnN0IHN0ZXAgPSB2YXJpYWJsZShTVE9QLCBzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGkpKSlcbiAgICAgIGNvbnN0IHJlcSA9IHZhcmlhYmxlKHN0ZXAucmVxX2lkKVxuICAgICAgY29uc3QgcmVxdWVzdCA9IHZhcmlhYmxlKFJFUSwgcmVxdWVzdHMuYXQocmVxKSlcbiAgICAgIGNvbnN0IG5leHRQb3MgPSB2YXJpYWJsZShpZkVsc2Uoc3RlcC5pc19sb2FkLCByZXF1ZXN0LnN0YXJ0LCByZXF1ZXN0LmVuZCkpXG4gICAgICBjb25zdCBkaXN0YW5jZSA9IHZhcmlhYmxlKHJvYWRDb3N0LmNhbGwocG9zLCBuZXh0UG9zKSlcbiAgICAgIGNvc3QuaWFkZChkaXN0YW5jZS5tdWwoS01fQ09TVF9DRU5UUykpXG4gICAgICBlbGFwc2VkTWludXRlcy5pYWRkKGRpc3RhbmNlKVxuICAgICAgcG9zLnNldChuZXh0UG9zKVxuICAgICAgY29uc3QgZGVjayA9IHZhcmlhYmxlKGlmRWxzZShzdGVwLmRlY2ssIGRlY2sxLCBkZWNrMCkpXG4gICAgICBjb25zdCBkZWNrU2l6ZSA9IHZhcmlhYmxlKGlmRWxzZShzdGVwLmRlY2ssIGRlY2tTaXplMSwgZGVja1NpemUwKSlcblxuICAgICAgd2hlbihzdGVwLmlzX2xvYWQsICgpID0+IHtcbiAgICAgICAgd2hlbihkZWNrU2l6ZS5ndCgyKSwgKCkgPT4gcmV0dXJuXygtSU5GKSlcbiAgICAgICAgZGVjay5zZXQoZGVjay5vcihyZXEuc2hsKGRlY2tTaXplLm11bCgxMCkpKSlcbiAgICAgICAgZGVja1NpemUuaWFkZCgxKVxuICAgICAgfSwgKCkgPT4ge1xuICAgICAgICBjb25zdCBmb3VuZCA9IHZhcmlhYmxlKC0xKVxuICAgICAgICB3aGVuKGRlY2tTaXplLmd0KDApLmFuZChkZWNrLmFuZCgxMDIzKS5lcShyZXEpKSwgKCkgPT4gZm91bmQuc2V0KDApKVxuICAgICAgICB3aGVuKGZvdW5kLmVxKC0xKS5hbmQoZGVja1NpemUuZ3QoMSkpLmFuZChkZWNrLnNocigxMCkuYW5kKDEwMjMpLmVxKHJlcSkpLCAoKSA9PiBmb3VuZC5zZXQoMSkpXG4gICAgICAgIHdoZW4oZm91bmQuZXEoLTEpLmFuZChkZWNrU2l6ZS5ndCgyKSkuYW5kKGRlY2suc2hyKDIwKS5hbmQoMTAyMykuZXEocmVxKSksICgpID0+IGZvdW5kLnNldCgyKSlcbiAgICAgICAgd2hlbihmb3VuZC5lcSgtMSksICgpID0+IHJldHVybl8oLUlORikpXG4gICAgICAgIGNvc3QuaWFkZChkZWNrU2l6ZS5zdWIoZm91bmQpLnN1YigxKS5tdWwoUkVPUkdfQ09TVF9DRU5UUykpXG4gICAgICAgIGNvbnN0IHNoaWZ0ID0gZm91bmQubXVsKDEwKVxuICAgICAgICBjb25zdCBsb3dlck1hc2sgPSBpMzIoMSkuc2hsKHNoaWZ0KS5zdWIoMSlcbiAgICAgICAgZGVjay5zZXQoZGVjay5hbmQobG93ZXJNYXNrKS5vcihkZWNrLnNocihzaGlmdC5hZGQoMTApKS5zaGwoc2hpZnQpKSlcbiAgICAgICAgZGVja1NpemUuaXN1YigxKVxuICAgICAgICB3aGVuKGVsYXBzZWRNaW51dGVzLmd0KHJlcXVlc3QuZGVhZGxpbmUpLmVxKDApLCAoKSA9PiByZXdhcmQuaWFkZChyZXF1ZXN0LnZhbHVlKSlcbiAgICAgIH0pXG5cbiAgICAgIHdoZW4oc3RlcC5kZWNrLFxuICAgICAgICAoKSA9PiB7IGRlY2sxLnNldChkZWNrKTsgZGVja1NpemUxLnNldChkZWNrU2l6ZSkgfSxcbiAgICAgICAgKCkgPT4geyBkZWNrMC5zZXQoZGVjayk7IGRlY2tTaXplMC5zZXQoZGVja1NpemUpIH0sXG4gICAgICApXG4gICAgfSlcbiAgICByZXR1cm4gcmV3YXJkLnN1Yihjb3N0KVxuICB9KVxuXG4gIGNvbnN0IHRyeUFzc2lnbiA9IGZuKFtcImkzMlwiXSwgXCJ2b2lkXCIsIHRlbXBlcmF0dXJlID0+IHtcbiAgICBjb25zdCB0cmFuID0gcmFuZGludC5jYWxsKHBsYW5uZXIuTlRSQU5TKVxuICAgIGNvbnN0IHJlcV9pZCA9IHJhbmRpbnQuY2FsbChwbGFubmVyLk5SRVFTKVxuICAgIGNvbnN0IHNjaGVkVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUodG9mZnNldC5hZGQodGFyZ2V0KSwgdG9mZnNldC5hZGQoc291cmNlKSwgY291bnQpLFxuICAgICAgYXQ6IChpbmRleDogRXhwcjxcImkzMlwiPikgPT4gc2NoZWR1bGUuYXQodG9mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG5cbiAgICB3aGVuKGFzc2lnbmVkLmF0KHJlcV9pZCkuZXEoMSksICgpID0+IHJldHVybl8oKSlcbiAgICBjb25zdCB0b2Zmc2V0ID0gdHJhbi5tdWwoVFNJWkUpXG4gICAgY29uc3QgdHNpemUgPSB2YXJpYWJsZShzY2hlZF9zaXplLmF0KHRyYW4pKVxuICAgIHdoZW4odHNpemUuZ3QoVFNJWkUgLSAyKSwgKCkgPT4gcmV0dXJuXygpKVxuICAgIGNvbnN0IHByZXZpb3VzU2NvcmUgPSB2YXJpYWJsZShyYXRpbmdzLmF0KHRyYW4pKVxuICAgIGNvbnN0IEEgPSByYW5kaW50LmNhbGwodHNpemUuYWRkKDEpKVxuICAgIGNvbnN0IEIgPSB2YXJpYWJsZShBLmFkZChyYW5kaW50LmNhbGwoNCkpKVxuICAgIHdoZW4oQi5ndCh0c2l6ZSksICgpID0+IEIuc2V0KHRzaXplKSlcbiAgICBzY2hlZFZpZXcubW92ZShCLmFkZCgyKSwgQiwgdHNpemUuc3ViKEIpKVxuICAgIHNjaGVkVmlldy5tb3ZlKEEuYWRkKDEpLCBBLCBCLnN1YihBKSlcbiAgICBjb25zdCB0bXAgPSByYW5kaW50LmNhbGwoMilcbiAgICBzY2hlZFZpZXcuYXQoQSkuc2V0KHsgcmVxX2lkLCBpc19sb2FkOiAxLCBkZWNrOiB0bXAgfSlcbiAgICBzY2hlZFZpZXcuYXQoQi5hZGQoMSkpLnNldCh7IHJlcV9pZCwgaXNfbG9hZDogMCwgZGVjazogdG1wIH0pXG4gICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQodHNpemUuYWRkKDIpKVxuICAgIGNvbnN0IG5leHRTY29yZSA9IHJhdGVUcmFuLmNhbGwodHJhbilcbiAgICB3aGVuKGFjY2VwdEFubmVhbC5jYWxsKHByZXZpb3VzU2NvcmUsIG5leHRTY29yZSwgdGVtcGVyYXR1cmUpLCAoKSA9PiB7XG4gICAgICBhc3NpZ25lZC5hdChyZXFfaWQpLnNldCgxKVxuICAgICAgcmF0aW5ncy5hdCh0cmFuKS5zZXQobmV4dFNjb3JlKVxuICAgIH0sICgpID0+IHtcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEEsIEEuYWRkKDEpLCBCLnN1YihBKSlcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEIsIEIuYWRkKDIpLCB0c2l6ZS5zdWIoQikpXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZSlcbiAgICB9KVxuICB9KVxuXG4gIGNvbnN0IHRyeVVuYXNzaWduID0gZm4oW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kaW50LmNhbGwocGxhbm5lci5OVFJBTlMpXG4gICAgY29uc3QgQSA9IHZhcmlhYmxlKC0xKSwgQiA9IHZhcmlhYmxlKC0xKVxuICAgIGNvbnN0IHRzaXplID0gdmFyaWFibGUoc2NoZWRfc2l6ZS5hdCh0cmFuKSlcbiAgICBjb25zdCBzY2hlZFZpZXcgPSB7XG4gICAgICBtb3ZlOiAodGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+KSA9PlxuICAgICAgICBzY2hlZHVsZS5tb3ZlKHRvZmZzZXQuYWRkKHRhcmdldCksIHRvZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHRvZmZzZXQuYWRkKGluZGV4KSksXG4gICAgfVxuXG4gICAgd2hlbih0c2l6ZS5sdCgyKSwgKCkgPT4gcmV0dXJuXygpKVxuICAgIGNvbnN0IHRvZmZzZXQgPSB0cmFuLm11bChUU0laRSlcbiAgICBjb25zdCBzZWxlY3RlZCA9IHZhcmlhYmxlKFNUT1AsIHNjaGVkVmlldy5hdChyYW5kaW50LmNhbGwodHNpemUpKSlcbiAgICBjb25zdCByZXEgPSB2YXJpYWJsZShzZWxlY3RlZC5yZXFfaWQpXG4gICAgY29uc3QgZGVjayA9IHZhcmlhYmxlKHNlbGVjdGVkLmRlY2spXG4gICAgZm9yXygwLCB0c2l6ZSwgaSA9PiB7XG4gICAgICBjb25zdCBzdGVwID0gdmFyaWFibGUoU1RPUCwgc2NoZWRWaWV3LmF0KGkpKVxuICAgICAgd2hlbihzdGVwLnJlcV9pZC5lcShyZXEpLCAoKSA9PiB3aGVuKEEuZXEoLTEpLCAoKSA9PiBBLnNldChpKSwgKCkgPT4gQi5zZXQoaSkpKVxuICAgIH0pXG4gICAgd2hlbihBLmVxKC0xKS5vcihCLmVxKC0xKSksICgpID0+IHJldHVybl8oKSlcbiAgICBjb25zdCBwcmV2aW91c1Njb3JlID0gdmFyaWFibGUocmF0aW5ncy5hdCh0cmFuKSlcbiAgICBzY2hlZFZpZXcubW92ZShBLCBBLmFkZCgxKSwgQi5zdWIoQSkuc3ViKDEpKVxuICAgIHNjaGVkVmlldy5tb3ZlKEIuc3ViKDEpLCBCLmFkZCgxKSwgdHNpemUuc3ViKEIpLnN1YigxKSlcbiAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZS5zdWIoMikpXG4gICAgY29uc3QgbmV4dFNjb3JlID0gcmF0ZVRyYW4uY2FsbCh0cmFuKVxuICAgIHdoZW4oYWNjZXB0QW5uZWFsLmNhbGwocHJldmlvdXNTY29yZSwgbmV4dFNjb3JlLCB0ZW1wZXJhdHVyZSksICgpID0+IHtcbiAgICAgIGFzc2lnbmVkLmF0KHJlcSkuc2V0KDApXG4gICAgICByYXRpbmdzLmF0KHRyYW4pLnNldChuZXh0U2NvcmUpXG4gICAgfSwgKCkgPT4ge1xuICAgICAgc2NoZWRWaWV3Lm1vdmUoQi5hZGQoMSksIEIuc3ViKDEpLCB0c2l6ZS5zdWIoQikuc3ViKDEpKVxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQS5hZGQoMSksIEEsIEIuc3ViKEEpLnN1YigxKSlcbiAgICAgIHNjaGVkVmlldy5hdChBKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMSwgZGVjayB9KVxuICAgICAgc2NoZWRWaWV3LmF0KEIpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAwLCBkZWNrIH0pXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZSlcbiAgICB9KVxuICB9KVxuXG4gIGNvbnN0IHRyeVJlbG9jYXRlID0gZm4oW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHNyYyA9IHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUyksIGRzdCA9IHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUylcbiAgICBjb25zdCBBID0gdmFyaWFibGUoLTEpLCBCID0gdmFyaWFibGUoLTEpXG4gICAgY29uc3Qgc3JjVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUoc3JjT2Zmc2V0LmFkZCh0YXJnZXQpLCBzcmNPZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHNyY09mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG4gICAgY29uc3QgZHN0VmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUoZHN0T2Zmc2V0LmFkZCh0YXJnZXQpLCBkc3RPZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KGRzdE9mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG5cbiAgICB3aGVuKHNyYy5lcShkc3QpLCAoKSA9PiByZXR1cm5fKCkpXG4gICAgY29uc3Qgc3JjU2l6ZSA9IHZhcmlhYmxlKHNjaGVkX3NpemUuYXQoc3JjKSlcbiAgICBjb25zdCBkc3RTaXplID0gdmFyaWFibGUoc2NoZWRfc2l6ZS5hdChkc3QpKVxuICAgIHdoZW4oc3JjU2l6ZS5sdCgyKS5vcihkc3RTaXplLmd0KFRTSVpFIC0gMikpLCAoKSA9PiByZXR1cm5fKCkpXG4gICAgY29uc3Qgc3JjT2Zmc2V0ID0gc3JjLm11bChUU0laRSlcbiAgICBjb25zdCBkc3RPZmZzZXQgPSBkc3QubXVsKFRTSVpFKVxuICAgIGNvbnN0IHNlbGVjdGVkID0gdmFyaWFibGUoU1RPUCwgc3JjVmlldy5hdChyYW5kaW50LmNhbGwoc3JjU2l6ZSkpKVxuICAgIGNvbnN0IHJlcSA9IHZhcmlhYmxlKHNlbGVjdGVkLnJlcV9pZClcbiAgICBjb25zdCBkZWNrID0gdmFyaWFibGUoc2VsZWN0ZWQuZGVjaylcbiAgICBmb3JfKDAsIHNyY1NpemUsIGkgPT4ge1xuICAgICAgY29uc3Qgc3RlcCA9IHZhcmlhYmxlKFNUT1AsIHNyY1ZpZXcuYXQoaSkpXG4gICAgICB3aGVuKHN0ZXAucmVxX2lkLmVxKHJlcSksICgpID0+IHdoZW4oQS5lcSgtMSksICgpID0+IEEuc2V0KGkpLCAoKSA9PiBCLnNldChpKSkpXG4gICAgfSlcbiAgICB3aGVuKEEuZXEoLTEpLm9yKEIuZXEoLTEpKSwgKCkgPT4gcmV0dXJuXygpKVxuICAgIGNvbnN0IHByZXZpb3VzU2NvcmUgPSByYXRpbmdzLmF0KHNyYykuYWRkKHJhdGluZ3MuYXQoZHN0KSlcbiAgICBzcmNWaWV3Lm1vdmUoQSwgQS5hZGQoMSksIEIuc3ViKEEpLnN1YigxKSlcbiAgICBzcmNWaWV3Lm1vdmUoQi5zdWIoMSksIEIuYWRkKDEpLCBzcmNTaXplLnN1YihCKS5zdWIoMSkpXG4gICAgc2NoZWRfc2l6ZS5hdChzcmMpLnNldChzcmNTaXplLnN1YigyKSlcbiAgICBjb25zdCBDID0gcmFuZGludC5jYWxsKGRzdFNpemUuYWRkKDEpKVxuICAgIGNvbnN0IEQgPSB2YXJpYWJsZShDLmFkZChyYW5kaW50LmNhbGwoNCkpKVxuICAgIHdoZW4oRC5ndChkc3RTaXplKSwgKCkgPT4gRC5zZXQoZHN0U2l6ZSkpXG4gICAgZHN0Vmlldy5tb3ZlKEQuYWRkKDIpLCBELCBkc3RTaXplLnN1YihEKSlcbiAgICBkc3RWaWV3Lm1vdmUoQy5hZGQoMSksIEMsIEQuc3ViKEMpKVxuICAgIGRzdFZpZXcuYXQoQykuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDEsIGRlY2sgfSlcbiAgICBkc3RWaWV3LmF0KEQuYWRkKDEpKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMCwgZGVjayB9KVxuICAgIHNjaGVkX3NpemUuYXQoZHN0KS5zZXQoZHN0U2l6ZS5hZGQoMikpXG4gICAgY29uc3QgbmV4dFNyYyA9IHJhdGVUcmFuLmNhbGwoc3JjKVxuICAgIGNvbnN0IG5leHREc3QgPSByYXRlVHJhbi5jYWxsKGRzdClcbiAgICB3aGVuKGFjY2VwdEFubmVhbC5jYWxsKHByZXZpb3VzU2NvcmUsIG5leHRTcmMuYWRkKG5leHREc3QpLCB0ZW1wZXJhdHVyZSksICgpID0+IHtcbiAgICAgIHJhdGluZ3MuYXQoc3JjKS5zZXQobmV4dFNyYylcbiAgICAgIHJhdGluZ3MuYXQoZHN0KS5zZXQobmV4dERzdClcbiAgICB9LCAoKSA9PiB7XG4gICAgICBkc3RWaWV3Lm1vdmUoQywgQy5hZGQoMSksIEQuc3ViKEMpKVxuICAgICAgZHN0Vmlldy5tb3ZlKEQsIEQuYWRkKDIpLCBkc3RTaXplLnN1YihEKSlcbiAgICAgIHNjaGVkX3NpemUuYXQoZHN0KS5zZXQoZHN0U2l6ZSlcbiAgICAgIHNyY1ZpZXcubW92ZShCLmFkZCgxKSwgQi5zdWIoMSksIHNyY1NpemUuc3ViKEIpLnN1YigxKSlcbiAgICAgIHNyY1ZpZXcubW92ZShBLmFkZCgxKSwgQSwgQi5zdWIoQSkuc3ViKDEpKVxuICAgICAgc3JjVmlldy5hdChBKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMSwgZGVjayB9KVxuICAgICAgc3JjVmlldy5hdChCKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMCwgZGVjayB9KVxuICAgICAgc2NoZWRfc2l6ZS5hdChzcmMpLnNldChzcmNTaXplKVxuICAgIH0pXG4gIH0pXG5cbiAgY29uc3QgdHJ5TnVkZ2VTdG9wID0gZm4oW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kaW50LmNhbGwocGxhbm5lci5OVFJBTlMpLCBzaXplID0gdmFyaWFibGUoc2NoZWRfc2l6ZS5hdCh0cmFuKSlcbiAgICBjb25zdCBmaXJzdCA9IHZhcmlhYmxlKDApLCBlbmQgPSB2YXJpYWJsZSgwKVxuXG4gICAgd2hlbihzaXplLmx0KDIpLCAoKSA9PiByZXR1cm5fKCkpXG4gICAgY29uc3Qgb2Zmc2V0ID0gdHJhbi5tdWwoVFNJWkUpXG4gICAgY29uc3QgZnJvbSA9IHJhbmRpbnQuY2FsbChzaXplKVxuICAgIGNvbnN0IHNlbGVjdGVkID0gdmFyaWFibGUoU1RPUCwgc2NoZWR1bGUuYXQob2Zmc2V0LmFkZChmcm9tKSkpXG4gICAgY29uc3Qgcm9sbCA9IHJhbmRpbnQuY2FsbChwYXJhbXMubnVkZ2VSYWRpdXMgKiAyKVxuICAgIGNvbnN0IHRhcmdldCA9IHZhcmlhYmxlKGZyb20uYWRkKGlmRWxzZShyb2xsLmx0KHBhcmFtcy5udWRnZVJhZGl1cyksIHJvbGwuc3ViKHBhcmFtcy5udWRnZVJhZGl1cyksIHJvbGwuc3ViKHBhcmFtcy5udWRnZVJhZGl1cyAtIDEpKSkpXG4gICAgd2hlbih0YXJnZXQubHQoMCksICgpID0+IHRhcmdldC5zZXQoMCkpXG4gICAgd2hlbih0YXJnZXQuZ3Qoc2l6ZS5zdWIoMSkpLCAoKSA9PiB0YXJnZXQuc2V0KHNpemUuc3ViKDEpKSlcbiAgICB3aGVuKHRhcmdldC5lcShmcm9tKSwgKCkgPT4gcmV0dXJuXygpKVxuICAgIHdoZW4odGFyZ2V0Lmx0KGZyb20pLFxuICAgICAgKCkgPT4geyBmaXJzdC5zZXQodGFyZ2V0KTsgZW5kLnNldChmcm9tKSB9LFxuICAgICAgKCkgPT4geyBmaXJzdC5zZXQoZnJvbS5hZGQoMSkpOyBlbmQuc2V0KHRhcmdldC5hZGQoMSkpIH0sXG4gICAgKVxuICAgIGZvcl8oZmlyc3QsIGVuZCwgaSA9PiB7XG4gICAgICBjb25zdCBjcm9zc2VkID0gdmFyaWFibGUoU1RPUCwgc2NoZWR1bGUuYXQob2Zmc2V0LmFkZChpKSkpXG4gICAgICB3aGVuKGNyb3NzZWQucmVxX2lkLmVxKHNlbGVjdGVkLnJlcV9pZCksICgpID0+IHJldHVybl8oKSlcbiAgICB9KVxuICAgIGNvbnN0IHByZXZpb3VzU2NvcmUgPSB2YXJpYWJsZShyYXRpbmdzLmF0KHRyYW4pKVxuICAgIHdoZW4odGFyZ2V0Lmx0KGZyb20pLFxuICAgICAgKCkgPT4gc2NoZWR1bGUubW92ZShvZmZzZXQuYWRkKHRhcmdldC5hZGQoMSkpLCBvZmZzZXQuYWRkKHRhcmdldCksIGZyb20uc3ViKHRhcmdldCkpLFxuICAgICAgKCkgPT4gc2NoZWR1bGUubW92ZShvZmZzZXQuYWRkKGZyb20pLCBvZmZzZXQuYWRkKGZyb20uYWRkKDEpKSwgdGFyZ2V0LnN1Yihmcm9tKSksXG4gICAgKVxuICAgIHNjaGVkdWxlLmF0KG9mZnNldC5hZGQodGFyZ2V0KSkuc2V0KHNlbGVjdGVkKVxuICAgIGNvbnN0IG5leHRTY29yZSA9IHJhdGVUcmFuLmNhbGwodHJhbilcbiAgICB3aGVuKGFjY2VwdEFubmVhbC5jYWxsKHByZXZpb3VzU2NvcmUsIG5leHRTY29yZSwgdGVtcGVyYXR1cmUpLCAoKSA9PiB7XG4gICAgICByYXRpbmdzLmF0KHRyYW4pLnNldChuZXh0U2NvcmUpXG4gICAgfSwgKCkgPT4ge1xuICAgICAgd2hlbih0YXJnZXQubHQoZnJvbSksXG4gICAgICAgICgpID0+IHNjaGVkdWxlLm1vdmUob2Zmc2V0LmFkZCh0YXJnZXQpLCBvZmZzZXQuYWRkKHRhcmdldC5hZGQoMSkpLCBmcm9tLnN1Yih0YXJnZXQpKSxcbiAgICAgICAgKCkgPT4gc2NoZWR1bGUubW92ZShvZmZzZXQuYWRkKGZyb20uYWRkKDEpKSwgb2Zmc2V0LmFkZChmcm9tKSwgdGFyZ2V0LnN1Yihmcm9tKSksXG4gICAgICApXG4gICAgICBzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGZyb20pKS5zZXQoc2VsZWN0ZWQpXG4gICAgfSlcbiAgfSlcblxuICBjb25zdCBhZGRSZXF1ZXN0ID0gZm4oW1wiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLCBcInZvaWRcIiwgKHJlcW4sIHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSkgPT4ge1xuICAgIHJlcXVlc3RzLmF0KHJlcW4pLnNldCh7IHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSB9KVxuICB9KVxuXG4gIGNvbnN0IGJvb3RzdHJhcCA9IGZuKFtdLCBcInZvaWRcIiwgKCkgPT4ge1xuICAgIGZvcl8oMCwgcGxhbm5lci5OVFJBTlMsIHRyYW4gPT4ge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gdHJhbi5tdWwoVFNJWkUpXG4gICAgICBjb25zdCBiZXN0UmVxID0gdmFyaWFibGUoLTEpLCBiZXN0U2NvcmUgPSB2YXJpYWJsZSgtSU5GKSwgc2NvcmUgPSB2YXJpYWJsZSgwKVxuICAgICAgZm9yXygwLCBwbGFubmVyLk5SRVFTLCByZXEgPT4ge1xuICAgICAgICB3aGVuKGFzc2lnbmVkLmF0KHJlcSkuZXEoMCksICgpID0+IHtcbiAgICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAxLCBkZWNrOiAwIH0pXG4gICAgICAgICAgc2NoZWR1bGUuYXQob2Zmc2V0LmFkZCgxKSkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDAsIGRlY2s6IDAgfSlcbiAgICAgICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCgyKVxuICAgICAgICAgIHNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKVxuICAgICAgICAgIHdoZW4oc2NvcmUuZ3QoYmVzdFNjb3JlKSwgKCkgPT4geyBiZXN0U2NvcmUuc2V0KHNjb3JlKTsgYmVzdFJlcS5zZXQocmVxKSB9KVxuICAgICAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KDApXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgd2hlbihiZXN0UmVxLmd0KC0xKS5hbmQoYmVzdFNjb3JlLmd0KC0xMl8wMDEpKSwgKCkgPT4ge1xuICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQpLnNldCh7IHJlcV9pZDogYmVzdFJlcSwgaXNfbG9hZDogMSwgZGVjazogMCB9KVxuICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQuYWRkKDEpKS5zZXQoeyByZXFfaWQ6IGJlc3RSZXEsIGlzX2xvYWQ6IDAsIGRlY2s6IDAgfSlcbiAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQoMilcbiAgICAgICAgYXNzaWduZWQuYXQoYmVzdFJlcSkuc2V0KDEpXG4gICAgICAgIHJhdGluZ3MuYXQodHJhbikuc2V0KGJlc3RTY29yZSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBjb25zdCBzZWFyY2ggPSBmbihbXSwgXCJ2b2lkXCIsICgpID0+IHtcbiAgICBkZWJ1ZyhcImRlYnVnZ2VyIG9uLlwiLCAwKVxuICAgIGZvcl8oMCwgVEVNUF9QSEFTRVMsIHBoYXNlID0+IHtcbiAgICAgIGNvbnN0IHRlbXBlcmF0dXJlID0gaTMyKHBhcmFtcy5zdGFydFRlbXBlcmF0dXJlKS5zdWIoXG4gICAgICAgIHBoYXNlLm11bChwYXJhbXMuc3RhcnRUZW1wZXJhdHVyZSAtIEVORF9URU1QX0NFTlRTKS5kaXYoVEVNUF9QSEFTRVMgLSAxKSxcbiAgICAgIClcbiAgICAgIGZvcl8oMCwgc3RlcHNQZXJQaGFzZSwgKCkgPT4ge1xuICAgICAgICBjb25zdCBtb3ZlID0gcmFuZGludC5jYWxsKHRvdGFsV2VpZ2h0KVxuICAgICAgICB3aGVuKG1vdmUubHQoYXNzaWduRW5kKSwgKCkgPT4gdHJ5QXNzaWduLmNhbGwodGVtcGVyYXR1cmUpLCAoKSA9PiB7XG4gICAgICAgICAgd2hlbihtb3ZlLmx0KHVuYXNzaWduRW5kKSwgKCkgPT4gdHJ5VW5hc3NpZ24uY2FsbCh0ZW1wZXJhdHVyZSksICgpID0+IHtcbiAgICAgICAgICAgIHdoZW4obW92ZS5sdChudWRnZUVuZCksICgpID0+IHRyeU51ZGdlU3RvcC5jYWxsKHRlbXBlcmF0dXJlKSwgKCkgPT4gdHJ5UmVsb2NhdGUuY2FsbCh0ZW1wZXJhdHVyZSkpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBjb25zdCBnZXRTdG9wID0gZm4oW1wiaTMyXCIsIFwiaTMyXCJdLCBTVE9QLFxuICAgICh0cmFuLCBpbmRleCkgPT4gc2NoZWR1bGUuYXQodHJhbi5tdWwoVFNJWkUpLmFkZChpbmRleCkpKVxuXG4gIGNvbnN0IHdhc20gPSBhd2FpdCBjb21waWxlKHtcbiAgICBhZGRSZXF1ZXN0LFxuICAgIGFzc2lnbmVkLFxuICAgIGJvb3RzdHJhcCxcbiAgICBkaXN0cyxcbiAgICBnZXRTdG9wLFxuICAgIHJhdGVUcmFuLFxuICAgIHJhdGluZ3MsXG4gICAgc2NoZWR1bGUsXG4gICAgc2VhcmNoLFxuICAgIHNjaGVkX3NpemUsXG4gICAgdHJhbl9wb3NpdGlvbnMsXG4gIH0pXG5cbiAgd2FzbS5kaXN0cy5zZXQocGxhbm5lci5yb2FkbWFwLkNvc3RNYXRyaXgpXG4gIHdhc20udHJhbl9wb3NpdGlvbnMuc2V0KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpXG4gIHBsYW5uZXIucmVxdWVzdHMuZm9yRWFjaCgocmVxdWVzdCwgaSkgPT5cbiAgICB3YXNtLmFkZFJlcXVlc3QoaSwgcmVxdWVzdC5zdGFydFBvaW50LCByZXF1ZXN0LmVuZFBvaW50LCBNYXRoLnJvdW5kKHJlcXVlc3QudmFsdWVfZXVyICogMTAwKSwgTWF0aC5mbG9vcihyZXF1ZXN0LmRlYWRsaW5lX2ggKiA2MCkpLFxuICApXG5cbiAgd2FzbS5ib290c3RyYXAoKVxuICBjb25zdCBzdGFydGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICB3YXNtLnNlYXJjaCgpXG4gIGNvbnN0IGVsYXBzZWRNcyA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRlZEF0XG4gIGNvbnN0IHJlc3VsdFNjaGVkdWxlID0gbmV3IFVpbnQzMkFycmF5KHBsYW5uZXIuTlRSQU5TICogVFNJWkUpXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgcGxhbm5lci5OVFJBTlM7IHRyYW4rKykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2FzbS5zY2hlZF9zaXplW3RyYW5dITsgaSsrKSB7XG4gICAgICBjb25zdCBzdG9wID0gd2FzbS5nZXRTdG9wKHRyYW4sIGkpXG4gICAgICByZXN1bHRTY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSA9IHN0b3AuaXNfbG9hZCB8IHN0b3AuZGVjayA8PCAxIHwgc3RvcC5yZXFfaWQgPDwgMlxuICAgIH1cbiAgfVxuICBjb25zdCB1bmFzc2lnbmVkID0gbmV3IEludDhBcnJheShwbGFubmVyLk5SRVFTKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHVuYXNzaWduZWQubGVuZ3RoOyBpKyspIHVuYXNzaWduZWRbaV0gPSB3YXNtLmFzc2lnbmVkW2ldID8gMCA6IDFcbiAgY29uc3Qgc2NoZWR1bGVSYXRpbmdzID0gbmV3IEludDMyQXJyYXkod2FzbS5yYXRpbmdzKVxuXG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGU6IHJlc3VsdFNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IG5ldyBVaW50MTZBcnJheSh3YXNtLnNjaGVkX3NpemUpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpLFxuICAgIFRTSVpFLFxuICAgIHNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiBzY2hlZHVsZVJhdGluZ3MucmVkdWNlKChzdW0sIHNjb3JlKSA9PiBzdW0gKyBzY29yZSwgMCksXG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgYnV0dG9uLCBjb2xvciwgZGl2LCBwLCBwb3B1cCwgc2VsZWN0LCBzcGFuLCBzdHlsZSwgdGFibGUsIHRkLCB0aCwgdHIgfSBmcm9tIFwiLi4vdmlldy9odG1sXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMgfSBmcm9tIFwiLi4vdmlldy9tYWluXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZywgdHlwZSBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi9hbm5lYWxpbmdfYmFzZWxpbmVcIjtcbmltcG9ydCB7IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiwgaW1wcm92ZWRBbm5lYWxpbmcsIHR5cGUgSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIH0gZnJvbSBcIi4vYW5uZWFsaW5nX2ltcHJvdmVkXCI7XG5pbXBvcnQgeyBhbm5lYWxpbmdXYXNtIH0gZnJvbSBcIi4vYW5uZWFsaW5nX3dhc21cIjtcbmltcG9ydCB7IEFWR19TUEVFRF9LTUgsIGdldERlY2ssIGdldFJlcSwgaW5pdEFubmVhbGluZ1N0YXRlLCBpc0xvYWQsIEtNX0NPU1RfQ0VOVFMsIFJFT1JHX0NPU1RfQ0VOVFMsIHNjb3JlUm91dGUgfSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCBjb25zdCBhdmFpbGFibGVTb2x2ZXJzID0ge1xuICB3YXNtOiBhbm5lYWxpbmdXYXNtLFxuICBiYXNlbGluZTogYmFzZWxpbmVBbm5lYWxpbmcsXG4gIGltcHJvdmVkOiBpbXByb3ZlZEFubmVhbGluZyxcbn0gYXMgY29uc3Q7XG50eXBlIFNvbHZlck5hbWUgPSBrZXlvZiB0eXBlb2YgYXZhaWxhYmxlU29sdmVycztcblxuY29uc3QgSU5JVElBTF9TT0xWRVI6IFNvbHZlck5hbWUgPSBcIndhc21cIjtcbmNvbnN0IGV1cm9zID0gKGNlbnRzOiBudW1iZXIpID0+IGAkeyhjZW50cyAvIDEwMCkudG9GaXhlZCgyKX3igqxgO1xuXG5jbGFzcyBTY29yZU1pc21hdGNoRXJyb3IgZXh0ZW5kcyBFcnJvciB7fVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTY2hlZHVsZShtb2Q6IE1vZHVsZSwgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQpIHtcbiAgY29uc3Qgc2NoZWR1bGUgPSBuZXcgVWludDMyQXJyYXkocmVzdWx0LnNjaGVkdWxlKVxuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IG1vZC5OVFJBTlM7IHRyYW4rKykge1xuICAgIGNvbnN0IHNpemUgPSByZXN1bHQuc2NoZWR1bGVTaXplc1t0cmFuXSFcbiAgICBpZiAoc2l6ZSA8IDAgfHwgc2l6ZSA+IHJlc3VsdC5UU0laRSkgdGhyb3cgbmV3IFNjb3JlTWlzbWF0Y2hFcnJvcihgVHJhbnNwb3J0ZXIgJHt0cmFufSBoYXMgaW52YWxpZCBzY2hlZHVsZSBzaXplICR7c2l6ZX1gKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICBjb25zdCBhdCA9IHRyYW4gKiByZXN1bHQuVFNJWkUgKyBpXG4gICAgICBjb25zdCBzdGVwID0gc2NoZWR1bGVbYXRdXG4gICAgICBpZiAoc3RlcCA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKGBUcmFuc3BvcnRlciAke3RyYW59IHNjaGVkdWxlIGlzIHRydW5jYXRlZCBhdCAke2l9YClcbiAgICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKSwgcmVxdWVzdCA9IG1vZC5yZXF1ZXN0c1tyZXFdXG4gICAgICBpZiAoIXJlcXVlc3QpIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRyYW5zcG9ydGVyICR7dHJhbn0gcmVmZXJlbmNlcyB1bmtub3duIHJlcXVlc3QgJHtyZXF9YClcbiAgICAgIGNvbnN0IHBvcyA9IGlzTG9hZChzdGVwKSA/IHJlcXVlc3Quc3RhcnRQb2ludCA6IHJlcXVlc3QuZW5kUG9pbnRcbiAgICAgIHNjaGVkdWxlW2F0XSA9IChzdGVwICYgMHhmZmZmKSB8IHBvcyA8PCAxNlxuICAgIH1cbiAgfVxuICByZXR1cm4gc2NoZWR1bGVcbn1cblxuZnVuY3Rpb24gY2hlY2tlZFJlc3VsdChtb2Q6IE1vZHVsZSwgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQpIHtcbiAgaWYgKHJlc3VsdC5zY2hlZHVsZVNpemVzLmxlbmd0aCAhPT0gbW9kLk5UUkFOUyB8fCByZXN1bHQuc2NoZWR1bGVSYXRpbmdzLmxlbmd0aCAhPT0gbW9kLk5UUkFOUylcbiAgICB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKFwiU29sdmVyIHJldHVybmVkIGluY29ycmVjdGx5IHNpemVkIHRyYW5zcG9ydGVyIGFycmF5c1wiKVxuICBjb25zdCBzY2hlZHVsZSA9IGNhbm9uaWNhbFNjaGVkdWxlKG1vZCwgcmVzdWx0KVxuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QpXG4gIE9iamVjdC5hc3NpZ24oc3RhdGUsIHtcbiAgICBUU0laRTogcmVzdWx0LlRTSVpFLFxuICAgIHNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHJlc3VsdC5zY2hlZHVsZVNpemVzLFxuICAgIHNjaGVkdWxlUmF0aW5nczogcmVzdWx0LnNjaGVkdWxlUmF0aW5ncyxcbiAgICB0cmFuU3RhcnQ6IHJlc3VsdC50cmFuU3RhcnQsXG4gICAgdW5hc3NpZ25lZDogcmVzdWx0LnVuYXNzaWduZWQsXG4gIH0pXG4gIGxldCB0b3RhbCA9IDBcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBtb2QuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBleHBlY3RlZCA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pLCByZXBvcnRlZCA9IHJlc3VsdC5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hXG4gICAgaWYgKHJlcG9ydGVkICE9PSBleHBlY3RlZClcbiAgICAgIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRyYW5zcG9ydGVyICR7dHJhbn0gc2NvcmUgbWlzbWF0Y2g6IHJlcG9ydGVkICR7cmVwb3J0ZWR9LCBKUyAke2V4cGVjdGVkfWApXG4gICAgdG90YWwgKz0gZXhwZWN0ZWRcbiAgfVxuICBpZiAocmVzdWx0LnRvdGFsU2NvcmUgIT09IHRvdGFsKVxuICAgIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRvdGFsIHNjb3JlIG1pc21hdGNoOiByZXBvcnRlZCAke3Jlc3VsdC50b3RhbFNjb3JlfSwgSlMgJHt0b3RhbH1gKVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwbGFubmVyVmlldyhtb2Q6IE1vZHVsZSk6IFByb21pc2U8SFRNTEVsZW1lbnQ+IHtcbiAgY29uc3Qgb3V0ZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmdyYXk7XG4gIGNvbnN0IGlubmVyQm9yZGVyID0gXCIxcHggc29saWQgXCIgKyBjb2xvci5saWdodGdyYXk7XG4gIGNvbnN0IGNlbGxQYWRkaW5nID0gXCIuMzVlbSAuNWVtXCI7XG4gIGNvbnN0IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCA9IFwiMi4xZW1cIjtcblxuICBsZXQgYW5uZWFsZXI6IEFubmVhbGluZ1Jlc3VsdCB8IG51bGwgPSBudWxsO1xuICBsZXQgYW5uZWFsaW5nU2Vzc2lvbjogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHwgbnVsbCA9IG51bGw7XG4gIGxldCBhbm5lYWxpbmdUaW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIGxldCBydW5JZCA9IDA7XG5cbiAgZnVuY3Rpb24gaXRlbUJ1dHRvbihpdGVtOiBudW1iZXIsIGxvYWQ/OiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVxID0gbW9kLnJlcXVlc3RzW2l0ZW1dITtcbiAgICBjb25zdCBzcCA9IHNwYW4oXG4gICAgICBpdGVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMywgXCIgXCIpLFxuICAgICAgc3R5bGUoe1xuICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICBib3JkZXI6IFwiMnB4IHNvbGlkIHRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuMmVtXCIsXG4gICAgICAgIHdoaXRlU3BhY2U6IFwicHJlXCIsXG4gICAgICAgIGZvbnRGYW1pbHk6IFwibW9ub3NwYWNlXCIsXG4gICAgICB9KSxcbiAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG9wdXAoXG4gICAgICAgICAgcChcIml0ZW0gXCIsIGl0ZW0pLFxuICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgdHIoY2VsbChcInN0YXR1c1wiKSwgY2VsbChsb2FkID8gXCJsb2FkXCIgOiBsb2FkID09PSBmYWxzZSA/IFwidW5sb2FkXCIgOiBcInVuYXNzaWduZWRcIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcInZhbHVlXCIpLCBjZWxsKHJlcS52YWx1ZV9ldXIgKyBcIuKCrFwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwiZGlzdFwiKSwgY2VsbChtb2Qucm9hZG1hcC5nZXRDb3N0TihyZXEuc3RhcnRQb2ludCwgcmVxLmVuZFBvaW50KSArIFwia21cIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcImRlYWRsaW5lXCIpLCBjZWxsKHJlcS5kZWFkbGluZV9oLnRvRml4ZWQoMikgKyBcImhcIikpLFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICk7XG5cbiAgICBsZXQgcG9pbnRzID0gW1xuICAgICAgeyBudW1iZXI6IHJlcS5zdGFydFBvaW50LCBsb2dvOiBcIvCfk6ZcIiB9LFxuICAgICAgeyBudW1iZXI6IHJlcS5lbmRQb2ludCwgbG9nbzogXCLwn4+gXCIgfSxcbiAgICBdO1xuXG4gICAgaWYgKGxvYWQgPT09IHRydWUpIHBvaW50cyA9IFtwb2ludHNbMF0hXTtcbiAgICBpZiAobG9hZCA9PT0gZmFsc2UpIHBvaW50cyA9IFtwb2ludHNbMV0hXTtcblxuICAgIHNwLm9ubW91c2VlbnRlciA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gY29sb3IuZ3JlZW47XG4gICAgICBoaWdodExpZ2h0cy5zZXQoW3sgcG9pbnRzIH1dKTtcbiAgICB9O1xuICAgIHNwLm9ubW91c2VsZWF2ZSA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gXCJ0cmFuc3BhcmVudFwiO1xuICAgIH07XG4gICAgcmV0dXJuIHNwO1xuICB9XG5cbiAgY29uc3QgY2VsbDogdHlwZW9mIHRkID0gKC4uLngpID0+IHRkKHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksIC4uLngpO1xuICBjb25zdCBjb250cm9scyA9IGRpdihzdHlsZSh7IGRpc3BsYXk6IFwiZmxleFwiLCBnYXA6IFwiLjVlbVwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBmbGV4V3JhcDogXCJ3cmFwXCIgfSkpO1xuICBjb25zdCBzY29yZUxpbmUgPSBwKCk7XG4gIGNvbnN0IHRpbWVMaW5lID0gcCgpO1xuICBjb25zdCBzb2x2ZXJTZWxlY3QgPSBzZWxlY3QoLi4uT2JqZWN0LmtleXMoYXZhaWxhYmxlU29sdmVycykgYXMgU29sdmVyTmFtZVtdKTtcbiAgY29uc3Qgc29sdmVyTGluZSA9IHAoXCJzb2x2ZXI6IFwiLCBzb2x2ZXJTZWxlY3QpO1xuXG5cbiAgY29uc3QgZGV0YWlsV3JhcCA9IGRpdigpO1xuICBjb25zdCB0YWJsZVdyYXAgPSBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgb3ZlcmZsb3dYOiBcImF1dG9cIixcbiAgICAgIG92ZXJmbG93WTogXCJoaWRkZW5cIixcbiAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICB9KSxcbiAgKTtcblxuICBjb25zdCBydW5CdXR0b24gPSBidXR0b24oXCJzdGFydFwiKTtcbiAgY29uc3QgaGVhdEJ1dHRvbiA9IGJ1dHRvbihcImhlYXQgdXBcIik7XG4gIGxldCByZW5kZXJDb3VudGVyID0gMDtcblxuICBmdW5jdGlvbiBzdG9wU2VhcmNoKCkge1xuICAgIGlmIChhbm5lYWxpbmdUaW1lciAhPSBudWxsKSB7XG4gICAgICBjbGVhckludGVydmFsKGFubmVhbGluZ1RpbWVyKTtcbiAgICAgIGFubmVhbGluZ1RpbWVyID0gbnVsbDtcbiAgICB9XG4gICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gXCJzdGFydFwiO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyVGFibGUoKSB7XG4gICAgY29uc3QgdGFiID0gdGFibGUoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIH0pLFxuICAgICAgdHIoXG4gICAgICAgIHRoKFwidHJhbnNwb3J0ZXJcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICAgIHRoKFwidmFsdWVcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICAgIHRoKFwic3RlcHNcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICApLFxuICAgICAgbW9kLnN0YXJ0cG9zaXRpb25zLm1hcCgoc3RhcnQsIHRyYW4pID0+XG4gICAgICAgIHRyKFxuICAgICAgICAgIHRkKFxuICAgICAgICAgICAgdHJhbixcbiAgICAgICAgICAgIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHBvcHVwKFxuICAgICAgICAgICAgICAgIHAoXCJ0cmFuc3BvcnRlcjogXCIsIHRyYW4pLFxuICAgICAgICAgICAgICAgIHAoXCJzdGFydDogXCIsIHN0YXJ0KSxcbiAgICAgICAgICAgICAgICBwKFwic2NvcmU6IFwiLCBldXJvcyhhbm5lYWxlcj8uc2NoZWR1bGVSYXRpbmdzW3RyYW5dID8/IDApKSxcbiAgICAgICAgICAgICAgICBwKFwic3RlcHM6IFwiLCBhbm5lYWxlcj8uc2NoZWR1bGVTaXplc1t0cmFuXSEpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb25tb3VzZWVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnRzID0gW3sgbnVtYmVyOiBzdGFydCwgbG9nbzogXCLwn5qbXCIgfV07XG4gICAgICAgICAgICAgICAgaWYgKGFubmVhbGVyKSB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFubmVhbGVyLnNjaGVkdWxlU2l6ZXNbdHJhbl0hOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IGFubmVhbGVyLnNjaGVkdWxlW3RyYW4gKiBhbm5lYWxlci5UU0laRSArIGldITtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG1vZC5yZXF1ZXN0c1tnZXRSZXEoc3RlcCldITtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goeyBudW1iZXI6IGlzTG9hZChzdGVwKSA/IHJlcXVlc3Quc3RhcnRQb2ludCA6IHJlcXVlc3QuZW5kUG9pbnQsIGxvZ286IFwiXCIgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGhpZ2h0TGlnaHRzLnNldChbeyBwb2ludHMgfV0pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBvbm1vdXNlbGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWdodExpZ2h0cy5zZXQoW10pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICAgIHRkKGV1cm9zKGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0gPz8gMCksIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSkpLFxuICAgICAgICAgIHRkKFxuICAgICAgICAgICAgdGFibGUoXG4gICAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgWzAsIDFdLm1hcCgoZGVjaykgPT5cbiAgICAgICAgICAgICAgICB0cihcbiAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20oeyBsZW5ndGg6IGFubmVhbGVyIS5zY2hlZHVsZVNpemVzW3RyYW5dISB9LCAoXywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGVwID0gYW5uZWFsZXI/LnNjaGVkdWxlW3RyYW4gKiBhbm5lYWxlci5UU0laRSArIGldITtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZCA9IGlzTG9hZChzdGVwKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRkKFxuICAgICAgICAgICAgICAgICAgICAgIGdldERlY2soc3RlcCkgPT09IGRlY2sgPyBpdGVtQnV0dG9uKGdldFJlcShzdGVwKSwgISFsb2FkKSA6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGxvYWQgPyBjb2xvci5ibHVlIDogY29sb3IuZ3JlZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGlubmVyQm9yZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogXCIuMmVtIC4zZW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiBcIjIuNmVtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgYm9yZGVyOiBvdXRlckJvcmRlcixcbiAgICAgICAgICAgICAgcGFkZGluZzogXCIuMjVlbVwiLFxuICAgICAgICAgICAgICB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcblxuICAgIHRhYmxlV3JhcC5yZXBsYWNlQ2hpbGRyZW4odGFiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlclN0YXR1cygpIHtcbiAgICBpZiAoIWFubmVhbGVyKSByZXR1cm47XG4gICAgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gYHNjb3JlOiAke2V1cm9zKGFubmVhbGVyLnRvdGFsU2NvcmUpfWA7XG4gICAgdGltZUxpbmUudGV4dENvbnRlbnQgPSBgc2VhcmNoIHRpbWU6ICR7KGFubmVhbGVyIS5lbGFwc2VkTXMvMTAwMCkudG9GaXhlZCgyKX0gc2A7XG5cbiAgICBkZXRhaWxXcmFwLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIGRpdihcbiAgICAgICAgcChcImRldGFpbHNcIiksXG4gICAgICAgIHRhYmxlKFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdHIoY2VsbChcInVuYXNzaWduZWQgcmVxdWVzdHNcIiksIGNlbGwoQXJyYXkuZnJvbShhbm5lYWxlciEudW5hc3NpZ25lZCkubWFwKCh4LCBpKSA9PiAoeyB4LCBpIH0pKS5maWx0ZXIoKHgpID0+IHgueCkuZmxhdE1hcCgoeCkgPT4gW3NwYW4oXCIgXCIpLCBpdGVtQnV0dG9uKHguaSldKSkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJzZWFyY2ggdGltZVwiKSwgY2VsbChgJHthbm5lYWxlcj8uZWxhcHNlZE1zID8/IDB9bXNgKSksXG4gICAgICAgICAgdHIoY2VsbChcInNjb3JlXCIpLCBjZWxsKGV1cm9zKGFubmVhbGVyLnRvdGFsU2NvcmUpKSksXG4gICAgICAgICAgdHIoY2VsbChcInRyYW5zcG9ydGVyIGNvdW50XCIpLCBjZWxsKG1vZC5OVFJBTlMpKSxcbiAgICAgICAgICB0cihjZWxsKFwicmVxdWVzdCBjb3VudFwiKSwgY2VsbChtb2QuTlJFUVMpKSxcbiAgICAgICAgICB0cihjZWxsKFwiY29zdCBwZXIga21cIiksIGNlbGwoZXVyb3MoS01fQ09TVF9DRU5UUykpKSxcbiAgICAgICAgICB0cihjZWxsKFwiYXZlcmFnZSBzcGVlZFwiKSwgY2VsbChgJHtBVkdfU1BFRURfS01IfWttL2hgKSksXG4gICAgICAgICAgdHIoY2VsbChcInJlb3JnYW5pemF0aW9uIGNvc3RcIiksIGNlbGwoZXVyb3MoUkVPUkdfQ09TVF9DRU5UUykpKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcihmb3JjZVRhYmxlID0gZmFsc2UpIHtcbiAgICBpZiAoIWFubmVhbGVyKSByZXR1cm47XG4gICAgcmVuZGVyU3RhdHVzKCk7XG4gICAgaWYgKGZvcmNlVGFibGUgfHwgKHJlbmRlckNvdW50ZXIrKyAlIDQgPT09IDApKSByZW5kZXJUYWJsZSgpO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gcnVuU29sdmVyKG5hbWU6IFNvbHZlck5hbWUpIHtcbiAgICBzdG9wU2VhcmNoKCk7XG4gICAgY29uc3QgaWQgPSArK3J1bklkO1xuICAgIGFubmVhbGluZ1Nlc3Npb24gPSBudWxsO1xuICAgIGFubmVhbGVyID0gbnVsbDtcbiAgICBydW5CdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHNjb3JlTGluZS50ZXh0Q29udGVudCA9IFwicnVubmluZ+KAplwiO1xuICAgIHRhYmxlV3JhcC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICBsZXQgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQgfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgaWYgKG5hbWUgPT09IFwiaW1wcm92ZWRcIikge1xuICAgICAgICBhbm5lYWxpbmdTZXNzaW9uID0gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZCwgMTUwXzAwMCk7XG4gICAgICAgIHJlc3VsdCA9IGFubmVhbGluZ1Nlc3Npb24uaXRlcmF0ZUZvck1zKDQyMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBhd2FpdCBhdmFpbGFibGVTb2x2ZXJzW25hbWVdKG1vZCk7XG4gICAgICB9XG4gICAgICBhbm5lYWxlciA9IGNoZWNrZWRSZXN1bHQobW9kLCByZXN1bHQpO1xuICAgICAgaWYgKGlkID09PSBydW5JZCkge1xuICAgICAgICByZW5kZXIodHJ1ZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFNjb3JlTWlzbWF0Y2hFcnJvcikgdGhyb3cgZXJyb3I7XG4gICAgICBpZiAoaWQgPT09IHJ1bklkKSBzY29yZUxpbmUudGV4dENvbnRlbnQgPSBgc29sdmVyIGZhaWxlZDogJHtTdHJpbmcoZXJyb3IpfWA7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChpZCA9PT0gcnVuSWQpIHtcbiAgICAgICAgcnVuQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIHJ1bkJ1dHRvbi50ZXh0Q29udGVudCA9IG5hbWUgPT09IFwiaW1wcm92ZWRcIiA/IFwic3RhcnRcIiA6IFwicnVuXCI7XG4gICAgICAgIGhlYXRCdXR0b24uaGlkZGVuID0gbmFtZSAhPT0gXCJpbXByb3ZlZFwiO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJ1bkJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGNvbnN0IG5hbWUgPSBzb2x2ZXJTZWxlY3QudmFsdWUgYXMgU29sdmVyTmFtZTtcbiAgICBpZiAobmFtZSAhPT0gXCJpbXByb3ZlZFwiKSB7XG4gICAgICB2b2lkIHJ1blNvbHZlcihuYW1lKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGFubmVhbGluZ1RpbWVyICE9IG51bGwpIHtcbiAgICAgIHN0b3BTZWFyY2goKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gXCJzdG9wXCI7XG4gICAgYW5uZWFsaW5nVGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKCFhbm5lYWxpbmdTZXNzaW9uKSByZXR1cm47XG4gICAgICBhbm5lYWxlciA9IGNoZWNrZWRSZXN1bHQobW9kLCBhbm5lYWxpbmdTZXNzaW9uLml0ZXJhdGVGb3JNcygxMjApKTtcbiAgICAgIHJlbmRlcigpO1xuICAgIH0sIDE1MCk7XG4gIH07XG5cbiAgaGVhdEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGlmICghYW5uZWFsaW5nU2Vzc2lvbikgcmV0dXJuO1xuICAgIGFubmVhbGVyID0gY2hlY2tlZFJlc3VsdChtb2QsIGFubmVhbGluZ1Nlc3Npb24ucmVoZWF0KCkpO1xuICAgIHJlbmRlcih0cnVlKTtcbiAgfTtcblxuICBzb2x2ZXJTZWxlY3Qub25jaGFuZ2UgPSAoKSA9PiB2b2lkIHJ1blNvbHZlcihzb2x2ZXJTZWxlY3QudmFsdWUgYXMgU29sdmVyTmFtZSk7XG4gIGNvbnRyb2xzLnJlcGxhY2VDaGlsZHJlbihydW5CdXR0b24sIGhlYXRCdXR0b24pO1xuICBhd2FpdCBydW5Tb2x2ZXIoSU5JVElBTF9TT0xWRVIpO1xuXG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgcGFkZGluZzogXCIxZW1cIixcbiAgICAgIG92ZXJmbG93WTogXCJhdXRvXCIsXG4gICAgICBvdmVyZmxvd1g6IFwiaGlkZGVuXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm94U2l6aW5nOiBcImJvcmRlci1ib3hcIixcbiAgICAgIG1pbkhlaWdodDogXCIwXCIsXG4gICAgfSksXG4gICAgY29udHJvbHMsXG4gICAgc29sdmVyTGluZSxcbiAgICBzY29yZUxpbmUsXG4gICAgdGltZUxpbmUsXG4gICAgdGFibGVXcmFwLFxuICAgIGRldGFpbFdyYXAsXG4gICk7XG59XG4iLAogICAgImltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4uL3BsYW5uZXJzL2FubmVhbGluZ19iYXNlbGluZVwiXG5pbXBvcnQgeyBhbm5lYWxpbmdXYXNtIH0gZnJvbSBcIi4uL3BsYW5uZXJzL2FubmVhbGluZ193YXNtXCJcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCJcbmltcG9ydCB7IGRpdiwgaDIsIHAsIHN0eWxlIH0gZnJvbSBcIi4vaHRtbFwiXG5cbmxldCByZXN1bHQ6IEFubmVhbGluZ1Jlc3VsdFxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0VXBXYXNtKHBsYW5uZXI6IE1vZHVsZSkge1xuICByZXN1bHQgPSBhd2FpdCBhbm5lYWxpbmdXYXNtKHBsYW5uZXIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3YXNtVmlldyhfcGxhbm5lcjogTW9kdWxlKSB7XG4gIGlmICghcmVzdWx0ICkgdGhyb3cgbmV3IEVycm9yKFwiV0FTTSBwbGFubmVyIGlzIG5vdCBzZXQgdXBcIilcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7IHBhZGRpbmc6IFwiMWVtXCIgfSksXG4gICAgaDIoXCJXQVNNIHBsYW5uZXJcIiksXG4gICAgcChcImFzc2lnbmVkOiBcIiwgcmVzdWx0LnVuYXNzaWduZWQubGVuZ3RoIC0gcmVzdWx0LnVuYXNzaWduZWQucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCkpLFxuICAgIHAoXCJzY2hlZHVsZSBzdGVwczogXCIsIHJlc3VsdC5zY2hlZHVsZVNpemVzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApKSxcbiAgICBwKFwic2VhcmNoIHRpbWU6IFwiLCByZXN1bHQuZWxhcHNlZE1zLnRvRml4ZWQoMiksIFwibXNcIiksXG4gIClcbn1cblxuIiwKICAgICIvLyBibGFrZTMudHNcbi8vIFB1cmUgVHlwZVNjcmlwdCBCTEFLRTMtMjU2IGltcGxlbWVudGF0aW9uLlxuXG5jb25zdCBPVVRfTEVOID0gMzI7XG5jb25zdCBCTE9DS19MRU4gPSA2NDtcbmNvbnN0IENIVU5LX0xFTiA9IDEwMjQ7XG5cbmNvbnN0IENIVU5LX1NUQVJUID0gMSA8PCAwO1xuY29uc3QgQ0hVTktfRU5EID0gMSA8PCAxO1xuY29uc3QgUEFSRU5UID0gMSA8PCAyO1xuY29uc3QgUk9PVCA9IDEgPDwgMztcblxuY29uc3QgSVY6IHJlYWRvbmx5IG51bWJlcltdID0gW1xuICAweDZhMDllNjY3LFxuICAweGJiNjdhZTg1LFxuICAweDNjNmVmMzcyLFxuICAweGE1NGZmNTNhLFxuICAweDUxMGU1MjdmLFxuICAweDliMDU2ODhjLFxuICAweDFmODNkOWFiLFxuICAweDViZTBjZDE5LFxuXTtcblxuY29uc3QgTVNHX1NDSEVEVUxFOiByZWFkb25seSAocmVhZG9ubHkgbnVtYmVyW10pW10gPSBbXG4gIFswLCAxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMCwgMTEsIDEyLCAxMywgMTQsIDE1XSxcbiAgWzIsIDYsIDMsIDEwLCA3LCAwLCA0LCAxMywgMSwgMTEsIDEyLCA1LCA5LCAxNCwgMTUsIDhdLFxuICBbMywgNCwgMTAsIDEyLCAxMywgMiwgNywgMTQsIDYsIDUsIDksIDAsIDExLCAxNSwgOCwgMV0sXG4gIFsxMCwgNywgMTIsIDksIDE0LCAzLCAxMywgMTUsIDQsIDAsIDExLCAyLCA1LCA4LCAxLCA2XSxcbiAgWzEyLCAxMywgOSwgMTEsIDE1LCAxMCwgMTQsIDgsIDcsIDIsIDUsIDMsIDAsIDEsIDYsIDRdLFxuICBbOSwgMTQsIDExLCA1LCA4LCAxMiwgMTUsIDEsIDEzLCAzLCAwLCAxMCwgMiwgNiwgNCwgN10sXG4gIFsxMSwgMTUsIDUsIDAsIDEsIDksIDgsIDYsIDE0LCAxMCwgMiwgMTIsIDMsIDQsIDcsIDEzXSxcbl07XG5cbmZ1bmN0aW9uIHJvdHIzMih4OiBudW1iZXIsIG46IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoKHggPj4+IG4pIHwgKHggPDwgKDMyIC0gbikpKSA+Pj4gMDtcbn1cblxuZnVuY3Rpb24gYWRkMzIoYTogbnVtYmVyLCBiOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGEgKyBiKSA+Pj4gMDtcbn1cblxuZnVuY3Rpb24gbG9hZDMyTEUoYnl0ZXM6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIChcbiAgICBieXRlc1tvZmZzZXRdISB8XG4gICAgKGJ5dGVzW29mZnNldCArIDFdISA8PCA4KSB8XG4gICAgKGJ5dGVzW29mZnNldCArIDJdISA8PCAxNikgfFxuICAgIChieXRlc1tvZmZzZXQgKyAzXSEgPDwgMjQpXG4gICkgPj4+IDA7XG59XG5cbmZ1bmN0aW9uIHN0b3JlMzJMRShvdXQ6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKTogdm9pZCB7XG4gIG91dFtvZmZzZXRdID0gdmFsdWUgJiAweGZmO1xuICBvdXRbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpICYgMHhmZjtcbiAgb3V0W29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNikgJiAweGZmO1xuICBvdXRbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KSAmIDB4ZmY7XG59XG5cbmZ1bmN0aW9uIHdvcmRzRnJvbUJsb2NrKGJsb2NrOiBVaW50OEFycmF5KTogbnVtYmVyW10ge1xuICBjb25zdCB3b3JkcyA9IG5ldyBBcnJheTxudW1iZXI+KDE2KS5maWxsKDApO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgIGNvbnN0IG9mZnNldCA9IGkgKiA0O1xuICAgIGlmIChvZmZzZXQgKyA0IDw9IGJsb2NrLmxlbmd0aCkge1xuICAgICAgd29yZHNbaV0gPSBsb2FkMzJMRShibG9jaywgb2Zmc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHZhbHVlID0gMDtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgNDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGJ5dGUgPSBibG9ja1tvZmZzZXQgKyBqXSA/PyAwO1xuICAgICAgICB2YWx1ZSB8PSBieXRlIDw8ICg4ICogaik7XG4gICAgICB9XG4gICAgICB3b3Jkc1tpXSA9IHZhbHVlID4+PiAwO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB3b3Jkcztcbn1cblxuZnVuY3Rpb24gZyhcbiAgc3RhdGU6IG51bWJlcltdLFxuICBhOiBudW1iZXIsXG4gIGI6IG51bWJlcixcbiAgYzogbnVtYmVyLFxuICBkOiBudW1iZXIsXG4gIG14OiBudW1iZXIsXG4gIG15OiBudW1iZXIsXG4pOiB2b2lkIHtcbiAgc3RhdGVbYV0gPSBhZGQzMihhZGQzMihzdGF0ZVthXSEsIHN0YXRlW2JdISksIG14KTtcbiAgc3RhdGVbZF0gPSByb3RyMzIoc3RhdGVbZF0hIF4gc3RhdGVbYV0hLCAxNik7XG4gIHN0YXRlW2NdID0gYWRkMzIoc3RhdGVbY10hLCBzdGF0ZVtkXSEpO1xuICBzdGF0ZVtiXSA9IHJvdHIzMihzdGF0ZVtiXSEgXiBzdGF0ZVtjXSEsIDEyKTtcblxuICBzdGF0ZVthXSA9IGFkZDMyKGFkZDMyKHN0YXRlW2FdISwgc3RhdGVbYl0hKSwgbXkpO1xuICBzdGF0ZVtkXSA9IHJvdHIzMihzdGF0ZVtkXSEgXiBzdGF0ZVthXSEsIDgpO1xuICBzdGF0ZVtjXSA9IGFkZDMyKHN0YXRlW2NdISwgc3RhdGVbZF0hKTtcbiAgc3RhdGVbYl0gPSByb3RyMzIoc3RhdGVbYl0hIF4gc3RhdGVbY10hLCA3KTtcbn1cblxuZnVuY3Rpb24gcm91bmQoc3RhdGU6IG51bWJlcltdLCBtc2c6IHJlYWRvbmx5IG51bWJlcltdLCByb3VuZEluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3Qgc2NoZWR1bGUgPSBNU0dfU0NIRURVTEVbcm91bmRJbmRleF0hO1xuXG4gIGcoc3RhdGUsIDAsIDQsIDgsIDEyLCBtc2dbc2NoZWR1bGVbMF0hXSEsIG1zZ1tzY2hlZHVsZVsxXSFdISk7XG4gIGcoc3RhdGUsIDEsIDUsIDksIDEzLCBtc2dbc2NoZWR1bGVbMl0hXSEsIG1zZ1tzY2hlZHVsZVszXSFdISk7XG4gIGcoc3RhdGUsIDIsIDYsIDEwLCAxNCwgbXNnW3NjaGVkdWxlWzRdIV0hLCBtc2dbc2NoZWR1bGVbNV0hXSEpO1xuICBnKHN0YXRlLCAzLCA3LCAxMSwgMTUsIG1zZ1tzY2hlZHVsZVs2XSFdISwgbXNnW3NjaGVkdWxlWzddIV0hKTtcblxuICBnKHN0YXRlLCAwLCA1LCAxMCwgMTUsIG1zZ1tzY2hlZHVsZVs4XSFdISwgbXNnW3NjaGVkdWxlWzldIV0hKTtcbiAgZyhzdGF0ZSwgMSwgNiwgMTEsIDEyLCBtc2dbc2NoZWR1bGVbMTBdIV0hLCBtc2dbc2NoZWR1bGVbMTFdIV0hKTtcbiAgZyhzdGF0ZSwgMiwgNywgOCwgMTMsIG1zZ1tzY2hlZHVsZVsxMl0hXSEsIG1zZ1tzY2hlZHVsZVsxM10hXSEpO1xuICBnKHN0YXRlLCAzLCA0LCA5LCAxNCwgbXNnW3NjaGVkdWxlWzE0XSFdISwgbXNnW3NjaGVkdWxlWzE1XSFdISk7XG59XG5cbmZ1bmN0aW9uIGNvbXByZXNzKFxuICBjdjogcmVhZG9ubHkgbnVtYmVyW10sXG4gIGJsb2NrV29yZHM6IHJlYWRvbmx5IG51bWJlcltdLFxuICBjb3VudGVyOiBudW1iZXIsXG4gIGJsb2NrTGVuOiBudW1iZXIsXG4gIGZsYWdzOiBudW1iZXIsXG4pOiBudW1iZXJbXSB7XG4gIGNvbnN0IGNvdW50ZXJMb3cgPSBjb3VudGVyID4+PiAwO1xuICBjb25zdCBjb3VudGVySGlnaCA9IE1hdGguZmxvb3IoY291bnRlciAvIDB4MTAwMDAwMDAwKSA+Pj4gMDtcblxuICBjb25zdCBzdGF0ZSA9IFtcbiAgICBjdlswXSEsXG4gICAgY3ZbMV0hLFxuICAgIGN2WzJdISxcbiAgICBjdlszXSEsXG4gICAgY3ZbNF0hLFxuICAgIGN2WzVdISxcbiAgICBjdls2XSEsXG4gICAgY3ZbN10hLFxuICAgIElWWzBdISxcbiAgICBJVlsxXSEsXG4gICAgSVZbMl0hLFxuICAgIElWWzNdISxcbiAgICBjb3VudGVyTG93LFxuICAgIGNvdW50ZXJIaWdoLFxuICAgIGJsb2NrTGVuLFxuICAgIGZsYWdzLFxuICBdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgcm91bmQoc3RhdGUsIGJsb2NrV29yZHMsIGkpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBzdGF0ZVswXSEgXiBzdGF0ZVs4XSEsXG4gICAgc3RhdGVbMV0hIF4gc3RhdGVbOV0hLFxuICAgIHN0YXRlWzJdISBeIHN0YXRlWzEwXSEsXG4gICAgc3RhdGVbM10hIF4gc3RhdGVbMTFdISxcbiAgICBzdGF0ZVs0XSEgXiBzdGF0ZVsxMl0hLFxuICAgIHN0YXRlWzVdISBeIHN0YXRlWzEzXSEsXG4gICAgc3RhdGVbNl0hIF4gc3RhdGVbMTRdISxcbiAgICBzdGF0ZVs3XSEgXiBzdGF0ZVsxNV0hLFxuICAgIHN0YXRlWzhdISBeIGN2WzBdISxcbiAgICBzdGF0ZVs5XSEgXiBjdlsxXSEsXG4gICAgc3RhdGVbMTBdISBeIGN2WzJdISxcbiAgICBzdGF0ZVsxMV0hIF4gY3ZbM10hLFxuICAgIHN0YXRlWzEyXSEgXiBjdls0XSEsXG4gICAgc3RhdGVbMTNdISBeIGN2WzVdISxcbiAgICBzdGF0ZVsxNF0hIF4gY3ZbNl0hLFxuICAgIHN0YXRlWzE1XSEgXiBjdls3XSEsXG4gIF0ubWFwKCh4KSA9PiB4ID4+PiAwKTtcbn1cblxuY2xhc3MgT3V0cHV0IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgaW5wdXRDVjogcmVhZG9ubHkgbnVtYmVyW10sXG4gICAgcmVhZG9ubHkgYmxvY2tXb3JkczogcmVhZG9ubHkgbnVtYmVyW10sXG4gICAgcmVhZG9ubHkgY291bnRlcjogbnVtYmVyLFxuICAgIHJlYWRvbmx5IGJsb2NrTGVuOiBudW1iZXIsXG4gICAgcmVhZG9ubHkgZmxhZ3M6IG51bWJlcixcbiAgKSB7fVxuXG4gIGNoYWluaW5nVmFsdWUoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBjb21wcmVzcyhcbiAgICAgIHRoaXMuaW5wdXRDVixcbiAgICAgIHRoaXMuYmxvY2tXb3JkcyxcbiAgICAgIHRoaXMuY291bnRlcixcbiAgICAgIHRoaXMuYmxvY2tMZW4sXG4gICAgICB0aGlzLmZsYWdzLFxuICAgICkuc2xpY2UoMCwgOCk7XG4gIH1cblxuICByb290Qnl0ZXMob3V0TGVuID0gT1VUX0xFTik6IFVpbnQ4QXJyYXkge1xuICAgIGNvbnN0IG91dCA9IG5ldyBVaW50OEFycmF5KG91dExlbik7XG4gICAgbGV0IG9mZnNldCA9IDA7XG4gICAgbGV0IG91dHB1dEJsb2NrQ291bnRlciA9IDA7XG5cbiAgICB3aGlsZSAob2Zmc2V0IDwgb3V0TGVuKSB7XG4gICAgICBjb25zdCB3b3JkcyA9IGNvbXByZXNzKFxuICAgICAgICB0aGlzLmlucHV0Q1YsXG4gICAgICAgIHRoaXMuYmxvY2tXb3JkcyxcbiAgICAgICAgb3V0cHV0QmxvY2tDb3VudGVyLFxuICAgICAgICB0aGlzLmJsb2NrTGVuLFxuICAgICAgICB0aGlzLmZsYWdzIHwgUk9PVCxcbiAgICAgICk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTYgJiYgb2Zmc2V0IDwgb3V0TGVuOyBpKyspIHtcbiAgICAgICAgY29uc3Qgd29yZEJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoNCk7XG4gICAgICAgIHN0b3JlMzJMRSh3b3JkQnl0ZXMsIDAsIHdvcmRzW2ldISk7XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCA0ICYmIG9mZnNldCA8IG91dExlbjsgaisrKSB7XG4gICAgICAgICAgb3V0W29mZnNldF0gPSB3b3JkQnl0ZXNbal0hO1xuICAgICAgICAgIG9mZnNldCsrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG91dHB1dEJsb2NrQ291bnRlcisrO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2h1bmtPdXRwdXQoXG4gIGNodW5rOiBVaW50OEFycmF5LFxuICBrZXk6IHJlYWRvbmx5IG51bWJlcltdLFxuICBjaHVua0NvdW50ZXI6IG51bWJlcixcbiAgZmxhZ3M6IG51bWJlcixcbik6IE91dHB1dCB7XG4gIGxldCBjdiA9IFsuLi5rZXldO1xuXG4gIGNvbnN0IGJsb2NrQ291bnQgPSBNYXRoLm1heCgxLCBNYXRoLmNlaWwoY2h1bmsubGVuZ3RoIC8gQkxPQ0tfTEVOKSk7XG5cbiAgZm9yIChsZXQgYmxvY2tJbmRleCA9IDA7IGJsb2NrSW5kZXggPCBibG9ja0NvdW50OyBibG9ja0luZGV4KyspIHtcbiAgICBjb25zdCBibG9ja1N0YXJ0ID0gYmxvY2tJbmRleCAqIEJMT0NLX0xFTjtcbiAgICBjb25zdCBibG9jayA9IGNodW5rLnN1YmFycmF5KGJsb2NrU3RhcnQsIGJsb2NrU3RhcnQgKyBCTE9DS19MRU4pO1xuICAgIGNvbnN0IGJsb2NrV29yZHMgPSB3b3Jkc0Zyb21CbG9jayhibG9jayk7XG5cbiAgICBjb25zdCBpc0ZpcnN0QmxvY2sgPSBibG9ja0luZGV4ID09PSAwO1xuICAgIGNvbnN0IGlzTGFzdEJsb2NrID0gYmxvY2tJbmRleCA9PT0gYmxvY2tDb3VudCAtIDE7XG5cbiAgICBjb25zdCBibG9ja0ZsYWdzID1cbiAgICAgIGZsYWdzIHxcbiAgICAgIChpc0ZpcnN0QmxvY2sgPyBDSFVOS19TVEFSVCA6IDApIHxcbiAgICAgIChpc0xhc3RCbG9jayA/IENIVU5LX0VORCA6IDApO1xuXG4gICAgaWYgKGlzTGFzdEJsb2NrKSB7XG4gICAgICByZXR1cm4gbmV3IE91dHB1dChjdiwgYmxvY2tXb3JkcywgY2h1bmtDb3VudGVyLCBibG9jay5sZW5ndGgsIGJsb2NrRmxhZ3MpO1xuICAgIH1cblxuICAgIGN2ID0gY29tcHJlc3MoY3YsIGJsb2NrV29yZHMsIGNodW5rQ291bnRlciwgQkxPQ0tfTEVOLCBibG9ja0ZsYWdzKS5zbGljZSgwLCA4KTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihcInVucmVhY2hhYmxlXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJlbnRPdXRwdXQoXG4gIGxlZnRDVjogcmVhZG9ubHkgbnVtYmVyW10sXG4gIHJpZ2h0Q1Y6IHJlYWRvbmx5IG51bWJlcltdLFxuICBrZXk6IHJlYWRvbmx5IG51bWJlcltdLFxuICBmbGFnczogbnVtYmVyLFxuKTogT3V0cHV0IHtcbiAgY29uc3QgYmxvY2tXb3JkcyA9IFsuLi5sZWZ0Q1YsIC4uLnJpZ2h0Q1ZdO1xuICByZXR1cm4gbmV3IE91dHB1dChrZXksIGJsb2NrV29yZHMsIDAsIEJMT0NLX0xFTiwgZmxhZ3MgfCBQQVJFTlQpO1xufVxuXG5mdW5jdGlvbiBwYXJlbnRDVihcbiAgbGVmdENWOiByZWFkb25seSBudW1iZXJbXSxcbiAgcmlnaHRDVjogcmVhZG9ubHkgbnVtYmVyW10sXG4gIGtleTogcmVhZG9ubHkgbnVtYmVyW10sXG4gIGZsYWdzOiBudW1iZXIsXG4pOiBudW1iZXJbXSB7XG4gIHJldHVybiBwYXJlbnRPdXRwdXQobGVmdENWLCByaWdodENWLCBrZXksIGZsYWdzKS5jaGFpbmluZ1ZhbHVlKCk7XG59XG5cbmZ1bmN0aW9uIGxhcmdlc3RQb3dlck9mVHdvTGVzc1RoYW4objogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IHBvd2VyID0gMTtcbiAgd2hpbGUgKHBvd2VyICogMiA8IG4pIHtcbiAgICBwb3dlciAqPSAyO1xuICB9XG4gIHJldHVybiBwb3dlcjtcbn1cblxuZnVuY3Rpb24gbGVmdExlbihpbnB1dExlbjogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgZnVsbENodW5rcyA9IE1hdGguZmxvb3IoKGlucHV0TGVuIC0gMSkgLyBDSFVOS19MRU4pO1xuICByZXR1cm4gbGFyZ2VzdFBvd2VyT2ZUd29MZXNzVGhhbihmdWxsQ2h1bmtzICsgMSkgKiBDSFVOS19MRU47XG59XG5cbmZ1bmN0aW9uIHN1YnRyZWVPdXRwdXQoXG4gIGlucHV0OiBVaW50OEFycmF5LFxuICBrZXk6IHJlYWRvbmx5IG51bWJlcltdLFxuICBjaHVua0NvdW50ZXI6IG51bWJlcixcbiAgZmxhZ3M6IG51bWJlcixcbik6IE91dHB1dCB7XG4gIGlmIChpbnB1dC5sZW5ndGggPD0gQ0hVTktfTEVOKSB7XG4gICAgcmV0dXJuIGNodW5rT3V0cHV0KGlucHV0LCBrZXksIGNodW5rQ291bnRlciwgZmxhZ3MpO1xuICB9XG5cbiAgY29uc3QgbGVmdExlbmd0aCA9IGxlZnRMZW4oaW5wdXQubGVuZ3RoKTtcblxuICBjb25zdCBsZWZ0ID0gaW5wdXQuc3ViYXJyYXkoMCwgbGVmdExlbmd0aCk7XG4gIGNvbnN0IHJpZ2h0ID0gaW5wdXQuc3ViYXJyYXkobGVmdExlbmd0aCk7XG5cbiAgY29uc3QgbGVmdENWID0gc3VidHJlZU91dHB1dChsZWZ0LCBrZXksIGNodW5rQ291bnRlciwgZmxhZ3MpLmNoYWluaW5nVmFsdWUoKTtcbiAgY29uc3QgcmlnaHRDViA9IHN1YnRyZWVPdXRwdXQoXG4gICAgcmlnaHQsXG4gICAga2V5LFxuICAgIGNodW5rQ291bnRlciArIGxlZnRMZW5ndGggLyBDSFVOS19MRU4sXG4gICAgZmxhZ3MsXG4gICkuY2hhaW5pbmdWYWx1ZSgpO1xuXG4gIHJldHVybiBwYXJlbnRPdXRwdXQobGVmdENWLCByaWdodENWLCBrZXksIGZsYWdzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJsYWtlMyhpbnB1dDogVWludDhBcnJheSB8IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBieXRlcyA9XG4gICAgdHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiID8gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKGlucHV0KSA6IGlucHV0O1xuXG4gIHJldHVybiBzdWJ0cmVlT3V0cHV0KGJ5dGVzLCBJViwgMCwgMCkucm9vdEJ5dGVzKE9VVF9MRU4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmxha2UzSGV4KGlucHV0OiBVaW50OEFycmF5IHwgc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIFsuLi5ibGFrZTMoaW5wdXQpXVxuICAgIC5tYXAoKGJ5dGUpID0+IGJ5dGUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSlcbiAgICAuam9pbihcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc2ggKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYmxha2UzSGV4KGlucHV0KS5zbGljZSgwLCAxNik7XG59XG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi9oYXNoXCI7XG5pbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kSW50LCByYW5kb20sIHNldFJhbmRTZWVkIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21VVUlELCB0eXBlIE1vZHVsZSwgdHlwZSBSZXF1ZXN0IH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IFJFQUxfUk9BRE1BUF9WRVJTSU9OID0gMTtcblxuZXhwb3J0IHR5cGUgRGVhbGVyU2l0ZSA9IHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBsb246IG51bWJlcjtcbiAgbGF0OiBudW1iZXI7XG4gIHNvdXJjZTogXCJvcGVuc3RyZWV0bWFwXCI7XG59O1xuXG5leHBvcnQgdHlwZSBSZWFsUm9hZE1hcENhY2hlID0ge1xuICB2ZXJzaW9uOiB0eXBlb2YgUkVBTF9ST0FETUFQX1ZFUlNJT047XG4gIGdlbmVyYXRlZEF0OiBzdHJpbmc7XG4gIHJvdXRpbmdQcm9maWxlOiBcImRyaXZpbmctaGd2XCI7XG4gIHJvdXRpbmdTb3VyY2U/OiBcIm9wZW5yb3V0ZXNlcnZpY2VcIiB8IFwiYXBwcm94aW1hdGVcIjtcbiAgc291cmNlSGFzaDogc3RyaW5nO1xuICBzaXRlczogRGVhbGVyU2l0ZVtdO1xuICAvKiogU3ltbWV0cmljLCBwYWNrZWQsIGludGVnZXIga2lsb21ldHJlczsgY29tcGF0aWJsZSB3aXRoIHRoZSBleGlzdGluZyBXQVNNIHNvbHZlci4gKi9cbiAgZGlzdGFuY2VzS206IG51bWJlcltdO1xuICAvKiogU3ltbWV0cmljLCBwYWNrZWQgdHJhdmVsIG1pbnV0ZXMuIEtlcHQgZm9yIHJlYWxpc3RpYyBkZWFkbGluZXMgYW5kIGZ1dHVyZSBzY29yaW5nLiAqL1xuICBkdXJhdGlvbnNNaW51dGVzOiBudW1iZXJbXTtcbn07XG5cbmV4cG9ydCB0eXBlIFJlYWxQb3MgPSB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICBsb246IG51bWJlcjtcbiAgbGF0OiBudW1iZXI7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrZWRSb2FkSW5kZXgocG9pbnRDb3VudDogbnVtYmVyLCBmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIpOiBudW1iZXIge1xuICBpZiAoZnJvbSA9PT0gdG8pIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBnZXQgYSByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIik7XG4gIGxldCBhID0gZnJvbTtcbiAgbGV0IGIgPSB0bztcbiAgaWYgKGEgPCBiKSBbYSwgYl0gPSBbYiwgYV07XG4gIGxldCBpbmRleCA9IGEgKyBwb2ludENvdW50ICogYjtcbiAgY29uc3QgcGFja2VkU2l6ZSA9IHBvaW50Q291bnQgKiBwb2ludENvdW50IC8gMjtcbiAgaWYgKGluZGV4ID4gcGFja2VkU2l6ZSkgaW5kZXggPSBwb2ludENvdW50ICoqIDIgLSBpbmRleDtcbiAgcmV0dXJuIGluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhbFJvYWRNYXBGcm9tQ2FjaGUoY2FjaGU6IFJlYWxSb2FkTWFwQ2FjaGUpIHtcbiAgaWYgKGNhY2hlLnZlcnNpb24gIT09IFJFQUxfUk9BRE1BUF9WRVJTSU9OKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCByZWFsLXJvYWRtYXAgY2FjaGUgdmVyc2lvbiAke2NhY2hlLnZlcnNpb259YCk7XG4gIH1cblxuICBjb25zdCBwb2ludENvdW50ID0gY2FjaGUuc2l0ZXMubGVuZ3RoO1xuICBpZiAocG9pbnRDb3VudCAlIDIgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZXhpc3RpbmcgcGFja2VkIFdBU00gbWF0cml4IGxheW91dCByZXF1aXJlcyBhbiBldmVuIG51bWJlciBvZiBzaXRlc1wiKTtcbiAgfVxuICBjb25zdCBtYXRyaXhTaXplID0gcG9pbnRDb3VudCAqIHBvaW50Q291bnQgLyAyO1xuICBpZiAoY2FjaGUuZGlzdGFuY2VzS20ubGVuZ3RoICE9PSBtYXRyaXhTaXplIHx8IGNhY2hlLmR1cmF0aW9uc01pbnV0ZXMubGVuZ3RoICE9PSBtYXRyaXhTaXplKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHJlYWwtcm9hZG1hcCBtYXRyaXggc2l6ZSBmb3IgJHtwb2ludENvdW50fSBzaXRlc2ApO1xuICB9XG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IFVpbnQzMkFycmF5LmZyb20oY2FjaGUuZGlzdGFuY2VzS20pO1xuICBjb25zdCBEdXJhdGlvbk1hdHJpeCA9IFVpbnQzMkFycmF5LmZyb20oY2FjaGUuZHVyYXRpb25zTWludXRlcyk7XG4gIGNvbnN0IHBvaW50czogUmVhbFBvc1tdID0gY2FjaGUuc2l0ZXMubWFwKHNpdGUgPT4gKHtcbiAgICB4OiBzaXRlLmxvbixcbiAgICB5OiBzaXRlLmxhdCxcbiAgICBsb246IHNpdGUubG9uLFxuICAgIGxhdDogc2l0ZS5sYXQsXG4gICAgaWQ6IHNpdGUuaWQsXG4gICAgbmFtZTogc2l0ZS5uYW1lLFxuICB9KSk7XG4gIGNvbnN0IHJhbmdlID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogcG9pbnRDb3VudCB9LCAoXywgaW5kZXgpID0+IGluZGV4KTtcbiAgY29uc3Qgcm9hZElEWCA9IChmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIpID0+IHBhY2tlZFJvYWRJbmRleChwb2ludENvdW50LCBmcm9tLCB0byk7XG4gIGNvbnN0IGdldHJvYWQgPSAoZnJvbTogbnVtYmVyLCB0bzogbnVtYmVyKSA9PiBDb3N0TWF0cml4W3JvYWRJRFgoZnJvbSwgdG8pXSE7XG4gIGNvbnN0IGZpbmRQYXRoID0gKGZyb206IG51bWJlciwgdG86IG51bWJlcikgPT4gZnJvbSA9PT0gdG8gPyBbZnJvbV0gOiBbZnJvbSwgdG9dO1xuICBjb25zdCBnZXRDb3N0TiA9ICguLi5zdG9wczogbnVtYmVyW10pID0+IHN1bUxlZ3MoQ29zdE1hdHJpeCwgcm9hZElEWCwgc3RvcHMpO1xuICBjb25zdCBnZXREdXJhdGlvbk1pbnV0ZXNOID0gKC4uLnN0b3BzOiBudW1iZXJbXSkgPT4gc3VtTGVncyhEdXJhdGlvbk1hdHJpeCwgcm9hZElEWCwgc3RvcHMpO1xuXG4gIHJldHVybiB7XG4gICAgcG9pbnRzLFxuICAgIHJhbmdlLFxuICAgIENvc3RNYXRyaXgsXG4gICAgRHVyYXRpb25NYXRyaXgsXG4gICAgcm9hZElEWCxcbiAgICBnZXRyb2FkLFxuICAgIGZpbmRQYXRoLFxuICAgIGdldENvc3ROLFxuICAgIGdldER1cmF0aW9uTWludXRlc04sXG4gICAgY2FjaGUsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHN1bUxlZ3MobWF0cml4OiBVaW50MzJBcnJheSwgaW5kZXg6IChhOiBudW1iZXIsIGI6IG51bWJlcikgPT4gbnVtYmVyLCBzdG9wczogbnVtYmVyW10pIHtcbiAgbGV0IHRvdGFsID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgKyAxIDwgc3RvcHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc3RvcHNbaV0gIT09IHN0b3BzW2kgKyAxXSkgdG90YWwgKz0gbWF0cml4W2luZGV4KHN0b3BzW2ldISwgc3RvcHNbaSArIDFdISldITtcbiAgfVxuICByZXR1cm4gdG90YWw7XG59XG5cbi8qKiBDcmVhdGVzIG5vcm1hbCBwbGFubmVyIGlucHV0IGZyb20gYSBjYWNoZWQgcmVhbCBtYXAgd2l0aG91dCBjaGFuZ2luZyB0aGUgc3ludGhldGljIGdlbmVyYXRvci4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFsTW9kdWxlKFxuICByb2FkbWFwOiBSZXR1cm5UeXBlPHR5cGVvZiByZWFsUm9hZE1hcEZyb21DYWNoZT4sXG4gIE5SRVFTID0gMjAwLFxuICBOVFJBTlMgPSA0MCxcbiAgc2VlZCA9IDIyLFxuKTogTW9kdWxlIHtcbiAgaWYgKHJvYWRtYXAucG9pbnRzLmxlbmd0aCA8IDIpIHRocm93IG5ldyBFcnJvcihcIkEgcmVhbCByb2FkbWFwIG5lZWRzIGF0IGxlYXN0IHR3byBkZWFsZXIgc2l0ZXNcIik7XG4gIHNldFJhbmRTZWVkKHNlZWQpO1xuXG4gIGNvbnN0IGRpZmZlcmVudFBvaW50ID0gKGZyb206IG51bWJlcikgPT4ge1xuICAgIGxldCB0byA9IHJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSk7XG4gICAgd2hpbGUgKHRvID09PSBmcm9tKSB0byA9IHJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSk7XG4gICAgcmV0dXJuIHRvO1xuICB9O1xuXG4gIGNvbnN0IHJlcXVlc3RzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogTlJFUVMgfSwgKCkgPT4ge1xuICAgIGNvbnN0IHN0YXJ0UG9pbnQgPSByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpO1xuICAgIGNvbnN0IGVuZFBvaW50ID0gZGlmZmVyZW50UG9pbnQoc3RhcnRQb2ludCk7XG4gICAgY29uc3QgZGlyZWN0TWludXRlcyA9IHJvYWRtYXAuZ2V0RHVyYXRpb25NaW51dGVzTihzdGFydFBvaW50LCBlbmRQb2ludCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiByYW5kb21VVUlEKCksXG4gICAgICBzdGFydFBvaW50LFxuICAgICAgZW5kUG9pbnQsXG4gICAgICB2YWx1ZV9ldXI6IHJhbmRJbnQoMTUwLCA2MDApLFxuICAgICAgZGVhZGxpbmVfaDogKGRpcmVjdE1pbnV0ZXMgKyA0ICogNjAgKyByYW5kb20oKSAqIDM2ICogNjApIC8gNjAsXG4gICAgfSBzYXRpc2ZpZXMgUmVxdWVzdDtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBOVFJBTlMsXG4gICAgTlJFUVMsXG4gICAgTUFQU0laRTogMSxcbiAgICBSU0laRTogcm9hZG1hcC5Db3N0TWF0cml4Lmxlbmd0aCxcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzLFxuICAgIHN0YXJ0cG9zaXRpb25zOiBBcnJheS5mcm9tKHsgbGVuZ3RoOiBOVFJBTlMgfSwgKCkgPT4gcmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFsUm9hZE1hcFNvdXJjZUhhc2goc2l0ZXM6IERlYWxlclNpdGVbXSwgcm91dGluZ1Byb2ZpbGUgPSBcImRyaXZpbmctaGd2XCIpIHtcbiAgcmV0dXJuIGhhc2goSlNPTi5zdHJpbmdpZnkoeyB2ZXJzaW9uOiBSRUFMX1JPQURNQVBfVkVSU0lPTiwgcm91dGluZ1Byb2ZpbGUsIHNpdGVzIH0pKTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgaGFzaCB9IGZyb20gXCIuLi9oYXNoXCI7XG5pbXBvcnQgeyBib2R5LCBidXR0b24sIGNvbG9yLCBkaXYsIGVycm9ycG9wdXAsIGgxLCBoMiwgaDMsIGlucHV0LCBtYXJnaW4sIHAsIHBhZGRpbmcsIHBvcHVwLCBwcmUsIHNwYW4sIHN0eWxlLCB0YWJsZSwgd2lkdGgsIHRleHRhcmVhLCBhLCBib3JkZXIsIGh0bWwsIHRoLCB0ciwgdGQsIGJvcmRlclJhZGl1cywgcGFuZWxMaXN0LCBkaXNwbGF5LCBiYWNrZ3JvdW5kIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgbWFwVmlldyB9IGZyb20gXCIuL21hcFZpZXdcIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyByYW5kb21Nb2R1bGUsIHJhbmRvbVVVSUQsIFJlcXVlc3QsIFNjaGVkdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBta1N0b3JlZCwgbWtXcml0YWJsZSwgdHlwZSBXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IHNldFJhbmRTZWVkIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHsgbnVtYmVyIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgcGxhbm5lclZpZXcgfSBmcm9tIFwiLi4vcGxhbm5lcnMvdmlld1BsYW5cIjtcbmltcG9ydCB7IHNldFVwV2FzbSwgd2FzbVZpZXcgfSBmcm9tIFwiLi93YXNtdmlld1wiO1xuaW1wb3J0IHsgcmVhbE1vZHVsZSwgcmVhbFJvYWRNYXBGcm9tQ2FjaGUsIHR5cGUgUmVhbFJvYWRNYXBDYWNoZSB9IGZyb20gXCIuLi9yZWFsX3JvYWRtYXBcIjtcblxuXG4vLyBWZXJzaW9uZWQga2V5cyBpbnRlbnRpb25hbGx5IHJlc2V0IHRoZSBlYXJsaWVyIHNtYWxsIFVJIGRlbW8gZGVmYXVsdHMgKDUvMjApLlxuZXhwb3J0IGxldCBMS1dfQ09VTlQgPSBta1N0b3JlZChcIkxLV19DT1VOVF9WMlwiLCBudW1iZXIsIDQwKVxubGV0IFJFUVVFU1RfQ09VTlQgPSBta1N0b3JlZChcIlJFUVVFU1RfQ09VTlRfVjJcIiwgbnVtYmVyLCAyMDApXG5cbmJvZHkuc3R5bGUubWFyZ2luID0gXCIwXCJcblxubGV0IGhlYWRlciA9IGgxKFwicm91dGUgcGxhbm5lclwiLCBzdHlsZSh7YmFja2dyb3VuZDogY29sb3IuYmx1ZSwgY29sb3I6IGNvbG9yLmJhY2tncm91bmQsIG1hcmdpbjogXCIwXCIsIHBhZGRpbmc6IFwiLjZlbVwifSkpXG5cbmxldCBjb250ZW50U3BhY2UgPSBkaXYoc3R5bGUoe1xuICBkaXNwbGF5OlwiZmxleFwiLFxuICBmbGV4RGlyZWN0aW9uOlwicm93XCIsXG4gIHdpZHRoOiBcIjEwMCVcIixcbiAgaGVpZ2h0OiBcImNhbGMoMTAwJSAtIDIuNWVtKVwiLFxuICBtaW5XaWR0aDogXCIwXCIsXG59KSlcblxubGV0IHBhZ2UgPSBkaXYoXG4gIHN0eWxlKHtkaXNwbGF5OlwiZmxleFwiLCBmbGV4RGlyZWN0aW9uOlwiY29sdW1uXCIsIGhlaWdodDogXCIxMDAlXCJ9KSxcbiAgaGVhZGVyLFxuICBjb250ZW50U3BhY2VcbilcblxuYm9keS5yZXBsYWNlQ2hpbGRyZW4ocGFnZSlcblxuc2V0UmFuZFNlZWQoMjQpXG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxNb2R1bGUoKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcIi4vcmVhbC1yb2FkbWFwLmpzb25cIilcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoYXdhaXQgcmVzcG9uc2UudGV4dCgpKVxuICAgIGNvbnN0IGNhY2hlID0gYXdhaXQgcmVzcG9uc2UuanNvbigpIGFzIFJlYWxSb2FkTWFwQ2FjaGVcbiAgICBjb25zdCByb2FkbWFwID0gcmVhbFJvYWRNYXBGcm9tQ2FjaGUoY2FjaGUpXG4gICAgY29uc29sZS5pbmZvKGBVc2luZyBjYWNoZWQgcmVhbCByb2FkbWFwIHdpdGggJHtyb2FkbWFwLnBvaW50cy5sZW5ndGh9IGNhciBkZWFsZXJzYClcbiAgICByZXR1cm4gcmVhbE1vZHVsZShyb2FkbWFwLCBSRVFVRVNUX0NPVU5ULmdldCgpLCBMS1dfQ09VTlQuZ2V0KCksIDI0KVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuaW5mbyhcIlVzaW5nIHN5bnRoZXRpYyByb2FkbWFwOyBidWlsZCB0aGUgcmVhbC1yb2FkbWFwIGNhY2hlIHRvIGVuYWJsZSBHZXJtYW55IGRhdGFcIiwgZXJyb3IpXG4gICAgcmV0dXJuIHJhbmRvbU1vZHVsZShSRVFVRVNUX0NPVU5ULmdldCgpLCBMS1dfQ09VTlQuZ2V0KCkpXG4gIH1cbn1cblxuZXhwb3J0IGxldCBtb2R1bGUgPSBhd2FpdCBpbml0aWFsTW9kdWxlKClcblxuZXhwb3J0IHR5cGUgSGlnaExpZ2h0ID0ge1xuICBwb2ludHM6IHtcbiAgICBudW1iZXI6IG51bWJlcixcbiAgICBsb2dvPyA6IHN0cmluZyxcbiAgfVtdLFxuICBjb2xvcj86IHN0cmluZ1xufVxuXG5leHBvcnQgbGV0IGhpZ2h0TGlnaHRzID0gbWtXcml0YWJsZSA8SGlnaExpZ2h0W10+KCBbXSApXG5cblxuZnVuY3Rpb24gc2V0dGVyIChzdG9yZTogV3JpdGFibGU8bnVtYmVyPiApe1xuICBsZXQgaW5wID0gaW5wdXQoKVxuICBpbnAudHlwZSA9IFwibnVtYmVyXCJcbiAgaW5wLm9uY2hhbmdlID0gKCk9PntcbiAgICBsZXQgdmFsID0gcGFyc2VJbnQoaW5wLnZhbHVlKVxuICAgIGlmIChpc05hTih2YWwpKSByZXR1cm5cbiAgICBzdG9yZS5zZXQodmFsKVxuICB9XG4gIHN0b3JlLm9udXBkYXRlKHZhbD0+aW5wLnZhbHVlID0gdmFsLnRvU3RyaW5nKCkpXG5cbiAgcmV0dXJuIGlucFxufVxuXG5cbmF3YWl0IHNldFVwV2FzbShtb2R1bGUpXG5cbmFzeW5jIGZ1bmN0aW9uIG1rV2luZG93ICh0YWI6IG51bWJlciA9IDAgKSB7XG5cbiAgbGV0IHRhYkZpZWxkcyA9IFtcbiAgICBbJ21hcCcsIG1hcFZpZXcobW9kdWxlKV0sXG4gICAgWydwbGFubmVyJywgYXdhaXQgcGxhbm5lclZpZXcobW9kdWxlKV0sXG4gICAgWyd3YXNtJywgd2FzbVZpZXcobW9kdWxlKV1cbiAgXSBhcyBjb25zdFxuXG4gIGNvbnN0IGVsID0gZGl2KHN0eWxlKHtcbiAgICBmbGV4OiBcIjEgMSAwXCIsXG4gICAgbWluV2lkdGg6IFwiMFwiLFxuICAgIGhlaWdodDogXCJjYWxjKDEwMHZoIC0gMWVtKVwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICBvdmVyZmxvdzogXCJoaWRkZW5cIixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICB9KSlcblxuICBmdW5jdGlvbiBvcGVuVGFiKHRhYjogdHlwZW9mIHRhYkZpZWxkc1tudW1iZXJdWzBdKSB7XG4gICAgY29uc3QgdGFicyA9IHAoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIG1hcmdpbjogXCIwXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjRlbVwiLFxuICAgICAgICBmbGV4OiBcIjAgMCBhdXRvXCIsXG4gICAgICB9KSxcbiAgICAgIHRhYkZpZWxkcy5tYXAoKFtuLGVdKT0+XG4gICAgICAgIHNwYW4oIG4sXG4gICAgICAgICAgKCk9Pm9wZW5UYWIobiksXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgcGFkZGluZzogXCIuM2VtXCIsXG4gICAgICAgICAgICBtYXJnaW46IFwiLjNlbVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrIChuPT10YWIgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXkpLFxuICAgICAgICAgICAgY29sb3I6IChuPT10YWIpID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5LFxuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG5cbiAgICBjb25zdCBjb250ZW50ID0gZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBmbGV4OiBcIjEgMSBhdXRvXCIsXG4gICAgICAgIG1pbkhlaWdodDogXCIwXCIsXG4gICAgICAgIG1pbldpZHRoOiBcIjBcIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLmZpbmQoKFtuLF0pPT5uPT10YWIpIVsxXVxuICAgIClcblxuICAgIGVsLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIHRhYnMsXG4gICAgICBjb250ZW50XG4gICAgKVxuICB9XG5cbiAgb3BlblRhYih0YWJGaWVsZHNbdGFiXSFbMF0pXG5cbiAgcmV0dXJuIGVsXG59XG5cbmNvbnRlbnRTcGFjZS5yZXBsYWNlQ2hpbGRyZW4oLi4uYXdhaXQgUHJvbWlzZS5hbGwoW21rV2luZG93KDEpLCBta1dpbmRvdygpXSkpXG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBRU8sSUFBTSxPQUFPLFNBQVM7QUFFN0IsSUFBTSxlQUFlO0FBQUEsRUFDbkIsT0FBTTtBQUFBLElBQ0osT0FBbUI7QUFBQSxJQUNuQixZQUFtQjtBQUFBLElBQ25CLEtBQW1CO0FBQUEsSUFDbkIsT0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLEVBQ3JCO0FBQUEsRUFDQSxNQUFLO0FBQUEsSUFDSCxPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsSUFDbkIsT0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsRUFDckI7QUFDRjtBQUVPLElBQU0sUUFBUTtBQUFBLEVBQ25CLE9BQU87QUFBQSxFQUNQLFlBQVk7QUFBQSxFQUNaLE1BQU07QUFBQSxFQUNOLFdBQVc7QUFBQSxFQUNYLEtBQUs7QUFBQSxFQUNMLE9BQU87QUFBQSxFQUNQLE1BQU07QUFBQSxFQUNOLFdBQVc7QUFDYjtBQUdBLElBQUksT0FBTyxTQUFTLGNBQWMsT0FBTztBQUN6QyxLQUFLLFlBQVk7QUFBQTtB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QUEsRUFFRixTQUFTLE9BQU8sQ0FBQyxNQUFrQztBQUFBLElBQ2pELE1BQU0sT0FBTyxFQUNYLE1BQU07QUFBQSxNQUNKLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxNQUNULE1BQU07QUFBQSxJQUNSLENBQUMsR0FDRCxVQUFVLElBQUksRUFBRSxHQUFFLE9BQ2hCLEtBQU0sR0FDSixNQUFJLFFBQVEsQ0FBQyxHQUNiLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFFBQVEsZ0JBQWUsS0FBRyxPQUFNLE1BQU0sUUFBUSxNQUFNO0FBQUEsTUFDcEQsT0FBUSxLQUFHLE9BQU8sTUFBTSxRQUFRLE1BQU07QUFBQSxJQUN4QyxDQUFDLENBQ0gsQ0FDRixDQUNGO0FBQUEsSUFFQSxNQUFNLFVBQVUsSUFDZCxNQUFNO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixXQUFXO0FBQUEsTUFDWCxVQUFVO0FBQUEsSUFDWixDQUFDLEdBQ0QsVUFBVSxLQUFLLEVBQUUsT0FBTSxLQUFHLElBQUcsRUFBRyxFQUNsQztBQUFBLElBRUEsR0FBRyxnQkFDRCxNQUNBLE9BQ0Y7QUFBQTtBQUFBLEVBR0YsUUFBUSxVQUFVLEtBQU0sRUFBRTtBQUFBLEVBRTFCLE9BQU87QUFBQTtBQUdULGFBQWEsZ0JBQWdCLEdBQUcsTUFBTSxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDOyIsCiAgImRlYnVnSWQiOiAiOTY1OUJGQkFFOUU4MUE1NjY0NzU2RTIxNjQ3NTZFMjEiLAogICJuYW1lcyI6IFtdCn0=
