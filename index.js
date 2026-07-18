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
    return this.write(lit(this.type, value));
  }
}
var nextLocalId = 0;
var nextControlId = 0;
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
var isStmt = (x) => !!x && typeof x === "object" && ("kind" in x) && (x.kind === "if" ? Array.isArray(x.then) : !["const", "local.get", "global.get", "bin", "call", "cast", "load", "cmp"].includes(x.kind));
var stmtList = (body2) => Array.isArray(body2) ? body2.flatMap(stmtList) : [body2];
var asStmts = (body2) => isStmt(body2) ? [body2] : Array.isArray(body2) ? stmtList(body2) : null;
var bindStmts = (body2, br, loop) => stmtList(body2).map((s) => bindStmt(s, br, loop));
var bindStmt = (s, br, loop) => {
  switch (s.kind) {
    case "if":
      return { ...s, then: bindStmts(s.then, br, loop), else: bindStmts(s.else, br, loop) };
    case "break":
      return { ...s, target: s.target ?? br };
    case "continue":
      if (s.target != null)
        return s;
      if (loop == null)
        throw new Error("continueTo() used outside a loop");
      return { ...s, target: loop };
    default:
      return s;
  }
};
var controlBody = (self, body2) => bindStmts(typeof body2 === "function" ? body2(self) : body2, self.id, self.kind === "loop" ? self.id : null);
var bin = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var bit = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var remainder = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var cmp = (op, left, right) => expr({ kind: "cmp", type: "i32", inputType: left.type, op, left, right: lit(left.type, right) });
var allocateLocal = (type) => expr({ kind: "local.get", type, local: nextLocalId++ });
var mkLocal = (type) => {
  const local = nextLocalId++;
  return mutable({ kind: "local.get", type, local }, (value) => ({ kind: "local.set", local, type, value }));
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
        return { kind: "call.void", target: handle, args: callArgs };
      const type = typeof result === "string" ? result : result.storage === "i64" ? "i64" : "i32";
      const call = expr({ kind: "call", type, target: handle, args: callArgs });
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
var readStruct = (type, packed) => Object.assign(Object.fromEntries(Object.keys(type.fields).map((name) => [name, readField(packed, type.layout[name])])), { packed });
var structValue = (type, packed) => {
  const fields = Object.fromEntries(Object.keys(type.fields).map((name) => [name, packedFieldValue(packed, type.layout[name])]));
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
var cast = (type, value, unsigned = false) => value.type === type ? value : expr({ kind: "cast", type, inputType: value.type, unsigned, value });
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
function ifElse(cond, then, else_) {
  return isStmt(then) || Array.isArray(then) ? { kind: "if", cond, then: stmtList(then), else: else_ === undefined ? [] : stmtList(else_) } : expr({ kind: "if", type: then.type, cond, then, else: else_ });
}
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
var func = (params, result, build) => mkHandle(params, result, build);
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
    move: (target, source, count) => ({ kind: "array.move", array: handle, target: lit("i32", target), source: lit("i32", source), count: lit("i32", count) })
  };
  return handle;
}
var mkStructLocal = (type) => structValue(type, mkLocal(type.storage === "i64" ? "i64" : "i32"));
var local = (type) => typeof type === "string" ? mkLocal(type) : mkStructLocal(type);
var expImpl = func(["f32"], "f32", (x) => {
  const y = local("f32");
  return [
    y.set(ifElse(x.lt(-16), f32(-16), ifElse(x.gt(16), f32(16), x)).div(2048).add(1)),
    ...Array.from({ length: 11 }, () => y.imul(y)),
    ret(y)
  ];
});
var exp = (value) => expImpl.call(value);
var global = (type, initial) => {
  let value;
  value = mutable({ kind: "global.get", type, initial }, (input) => ({ kind: "global.set", global: value, value: input }));
  return value;
};
function ret(value) {
  if (value === undefined)
    return { kind: "return" };
  if (typeof value === "object" && "packed" in value)
    return { kind: "return", value: value.packed };
  return { kind: "return", value: lit(inferType(value), value) };
}
var trap = (message) => ({ kind: "trap", message });
var log = (message, value) => ({ kind: "log", message, value: lit("i32", value) });
var loop = (cond, body2) => {
  const self = { kind: "loop", id: nextControlId++ };
  return { kind: "loop", control: self.id, cond, body: controlBody(self, body2) };
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
    case "break":
    case "continue":
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
    case "block":
      return walk(node.body, fns);
    case "loop":
      return children(node.cond, node.body);
    case "trap":
      fns.trap?.(node.message);
      return;
    case "log":
      fns.log?.(node.message);
      return walk(node.value, fns);
    case "expr":
      return walk(node.expr, fns);
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
var buildFunc = (func2) => {
  const params = func2.params.map((type) => allocateLocal(type));
  const paramIds = params.map((p3) => p3.kind === "local.get" ? p3.local : -1);
  const result = func2.build(...params);
  const built = typeof func2.result === "object" && !asStmts(result) ? result.packed : result;
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
    ...locals.map(([id], i) => [id, func2.params.length + i])
  ]);
  return { func: func2, built, locals, localIndexes, functions: [...functions], arrays: [...arrays], globals: [...globals], traps: [...traps], logs: [...logs] };
};
var buildReferencedFunctions = (roots) => {
  const built = new Map;
  const visit = (func2) => {
    if (built.has(func2))
      return;
    const entry = buildFunc(func2);
    built.set(func2, entry);
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
  const builtFuncs = buildReferencedFunctions(fEntries.map(([, func2]) => func2));
  const fix = new Map(builtFuncs.map(({ func: func2 }, i) => [func2, i]));
  const allArrays = [...new Set([...builtFuncs.flatMap((func2) => func2.arrays), ...Object.values(arrays)])];
  const allGlobals = [...new Set([...builtFuncs.flatMap((func2) => func2.globals), ...entries.filter(([, v]) => v.kind === "global.get").map(([, v]) => v)])];
  const globals = new Map(allGlobals.map((value, i) => [value, i]));
  const { layouts, bytes } = arrayLayouts(allArrays);
  const trapMessages = [...new Set(builtFuncs.flatMap((func2) => func2.traps))];
  const logMessages = [...new Set(builtFuncs.flatMap((func2) => func2.logs))];
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
var flatMap = (xs, fn) => xs.flatMap(fn);
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
  const depth = (stack, control, kind) => {
    const i = stack.findIndex((x) => x.control === control && x.kind === kind);
    if (i < 0)
      throw new Error(`Unknown ${kind} target ${control}`);
    return i;
  };
  const compileStmt = (s, stack = []) => {
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
        return [...compileExpr(s.cond), 4, 64, ...flatMap(s.then, (x) => compileStmt(x, [{}, ...stack])), ...s.else.length ? [5, ...flatMap(s.else, (x) => compileStmt(x, [{}, ...stack]))] : [], 11];
      case "block":
        return [2, 64, ...flatMap(s.body, (x) => compileStmt(x, [{ control: s.control, kind: "break" }, ...stack])), 11];
      case "loop":
        return [2, 64, 3, 64, ...compileExpr(s.cond), 69, 13, ...u32(1), ...flatMap(s.body, (x) => compileStmt(x, [{ control: s.control, kind: "continue" }, { control: s.control, kind: "break" }, ...stack])), 12, ...u32(0), 11, 11];
      case "break":
        if (s.target == null)
          throw new Error("breakTo() used outside a block or loop");
        return [12, ...u32(depth(stack, s.target, "break"))];
      case "continue":
        if (s.target == null)
          throw new Error("continueTo() used outside a loop");
        return [12, ...u32(depth(stack, s.target, "continue"))];
      case "return":
        return [...s.value ? compileExpr(s.value) : [], 15];
      case "trap":
        return [65, ...sN(traps.get(s.message), 32), 16, 0];
      case "log":
        return [65, ...sN(logs.get(s.message), 32), ...compileExpr(s.value), 16, 1];
      case "call.void":
        return [...flatMap(s.args, compileExpr), 16, ...u32(fix.get(s.target) + 2)];
      case "expr":
        return [...compileExpr(s.expr), 26];
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
  const exportSection = fEntries.flatMap(([name, func2]) => [...str(name), 0, ...u32(fix.get(func2) + 2)]);
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
      ...flatMap(builtFuncs, ({ func: func2 }) => {
        const result = resultType(func2.result);
        return [96, ...u32(func2.params.length), ...func2.params.map((t) => codes.type[t]), ...result === "void" ? [0] : [1, codes.type[result]]];
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
      ...flatMap(builtFuncs, ({ func: func2, built, locals, localIndexes }) => {
        const compiler = makeCompiler(fix, localIndexes, layouts, traps, logs, globals);
        const stmts = asStmts(built);
        const decls = [...u32(locals.length), ...flatMap(locals, ([, type]) => [...u32(1), codes.type[type]])];
        const result = resultType(func2.result);
        const code = stmts ? [...flatMap(stmts, (s) => compiler.stmt(s)), ...result === "void" ? [] : codes.zero[result]] : compiler.expr(built);
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
  for (const [name, func2] of funcEntries) {
    const wasmFunc = instance.exports[name];
    jsFuncs[name] = wasmFunc;
    if (typeof func2.result === "object") {
      resultStructs[name] = func2.result;
      jsFuncs[name] = (...args) => decodeStruct(func2.result, wasmFunc(...args));
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
var SEARCH_STEPS = 1600000;
var TEMP_PHASES = 1000;
var STEPS_PER_PHASE = Math.floor(SEARCH_STEPS / TEMP_PHASES);
var START_TEMP_CENTS = 5000;
var END_TEMP_CENTS = 0;
var DEBUG = false;
function debug(tag, value) {
  if (!DEBUG)
    return [];
  return [log(tag, value)];
}
function checkedArray(type, length) {
  const arr = array2(type, length);
  if (!DEBUG)
    return arr;
  const { at, move } = arr;
  const checkIdx = func(["i32", "i32"], "i32", (i, n) => ifElse(i.lt(0).or(n.lt(0)).or(n.add(i).gt(arr.length)), trap("array bounds exceeded"), ret(i)));
  arr.at = (index) => at(checkIdx.call(index, 1));
  arr.move = (target, source, count) => move(checkIdx.call(target, count), checkIdx.call(source, count), count);
  return arr;
}
function forN(n, body2) {
  const i = local("i32");
  return [i.set(0), loop(i.lt(n), [body2(i), i.iadd(1)])];
}
async function annealingWasm(planner) {
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
  const randState = global("i32", 1);
  const dists = checkedArray("i32", planner.RSIZE);
  const requests = checkedArray(REQ, planner.NREQS);
  const assigned = checkedArray("u8", planner.NREQS);
  const schedule = checkedArray(STOP, planner.NTRANS * TSIZE);
  const sched_size = checkedArray("i16", planner.NTRANS);
  const ratings = checkedArray("i32", planner.NTRANS);
  const tran_positions = checkedArray("i16", planner.NTRANS);
  const randNext = func([], "i32", () => {
    return [
      randState.set(randState.xor(randState.shl(13))),
      randState.set(randState.xor(randState.shr(17))),
      randState.set(randState.xor(randState.shl(5))),
      ret(randState)
    ];
  });
  const randint = func(["i32"], "i32", (max) => i32(i64u(randNext.call()).mul(i64u(max)).shr(32n)));
  const acceptAnneal2 = func(["i32", "i32", "i32"], "i32", (previous, next, temperature) => [
    ifElse(previous.gt(next), ret(randint.call(1e6).lt(i32(exp(f32(next.sub(previous)).div(f32(temperature))).mul(1e6)))), ret(1))
  ]);
  const roadCost = func(["i32", "i32"], "i32", (from, to) => {
    const a2 = local("i32"), b = local("i32"), tmp = local("i32"), index = local("i32");
    return [
      a2.set(from),
      b.set(to),
      ifElse(a2.lt(b), [tmp.set(a2), a2.set(b), b.set(tmp)]),
      index.set(a2.add(b.mul(NPOINTS))),
      ifElse(index.gt(planner.RSIZE), index.set(i32(NPOINTS ** 2).sub(index))),
      ret(dists.at(index))
    ];
  });
  const tryAssign = func(["i32"], "void", (temperature) => {
    const tran = local("i32");
    const req_id = local("i32");
    const A = local("i32");
    const B = local("i32");
    const tmp = local("i32");
    const tsize = local("i32");
    const toffset = local("i32");
    const previousScore = local("i32");
    const nextScore = local("i32");
    const schedView = {
      move: (target, source, count) => schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index) => schedule.at(toffset.add(index))
    };
    return [
      tran.set(randint.call(planner.NTRANS)),
      req_id.set(randint.call(planner.NREQS)),
      ifElse(assigned.at(req_id).eq(1), ret()),
      toffset.set(tran.mul(TSIZE)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.gt(TSIZE - 2), ret()),
      previousScore.set(ratings.at(tran)),
      A.set(randint.call(tsize.add(1))),
      B.set(A.add(randint.call(4))),
      ifElse(B.gt(tsize), B.set(tsize)),
      schedView.move(B.add(2), B, tsize.sub(B)),
      schedView.move(A.add(1), A, B.sub(A)),
      tmp.set(randint.call(2)),
      schedView.at(A).set({ req_id, is_load: 1, deck: tmp }),
      schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp }),
      sched_size.at(tran).set(tsize.add(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(acceptAnneal2.call(previousScore, nextScore, temperature), [assigned.at(req_id).set(1), ratings.at(tran).set(nextScore)], [
        schedView.move(A, A.add(1), B.sub(A)),
        schedView.move(B, B.add(2), tsize.sub(B)),
        sched_size.at(tran).set(tsize)
      ])
    ];
  });
  const rateTran = func(["i32"], "i32", (tran) => {
    const reward = local("i32"), cost = local("i32"), elapsedMinutes = local("i32"), distance = local("i32"), pos = local("i32");
    const offset = local("i32"), size = local("i32"), i = local("i32");
    const deck0 = local("i32"), deck1 = local("i32"), deckSize0 = local("i32"), deckSize1 = local("i32");
    const deck = local("i32"), deckSize = local("i32"), req = local("i32"), nextPos = local("i32");
    const found = local("i32"), shift = local("i32"), lowerMask = local("i32");
    const step = local(STOP), request = local(REQ);
    return [
      pos.set(tran_positions.at(tran)),
      offset.set(tran.mul(TSIZE)),
      size.set(sched_size.at(tran)),
      loop(i.lt(size), [
        step.set(schedule.at(offset.add(i))),
        req.set(step.req_id),
        request.set(requests.at(req)),
        nextPos.set(ifElse(step.is_load, request.start, request.end)),
        distance.set(roadCost.call(pos, nextPos)),
        cost.iadd(distance.mul(KM_COST_CENTS)),
        elapsedMinutes.iadd(distance.mul(60).div(AVG_SPEED_KMH)),
        pos.set(nextPos),
        deck.set(ifElse(step.deck, deck1, deck0)),
        deckSize.set(ifElse(step.deck, deckSize1, deckSize0)),
        ifElse(step.is_load, [
          ifElse(deckSize.gt(2), ret(-INF)),
          deck.set(deck.or(req.shl(deckSize.mul(10)))),
          deckSize.iadd(1)
        ], [
          found.set(-1),
          ifElse(deckSize.gt(0).and(deck.and(1023).eq(req)), found.set(0)),
          ifElse(found.eq(-1).and(deckSize.gt(1)).and(deck.shr(10).and(1023).eq(req)), found.set(1)),
          ifElse(found.eq(-1).and(deckSize.gt(2)).and(deck.shr(20).and(1023).eq(req)), found.set(2)),
          ifElse(found.eq(-1), ret(-INF)),
          cost.iadd(deckSize.sub(found).sub(1).mul(REORG_COST_CENTS)),
          shift.set(found.mul(10)),
          lowerMask.set(i32(1).shl(shift).sub(1)),
          deck.set(deck.and(lowerMask).or(deck.shr(shift.add(10)).shl(shift))),
          deckSize.isub(1),
          ifElse(elapsedMinutes.gt(request.deadline), [], reward.iadd(request.value))
        ]),
        ifElse(step.deck, [deck1.set(deck), deckSize1.set(deckSize)], [deck0.set(deck), deckSize0.set(deckSize)]),
        i.iadd(1)
      ]),
      ret(reward.sub(cost))
    ];
  });
  const tryUnassign = func(["i32"], "void", (temperature) => {
    const tran = local("i32"), req = local("i32"), deck = local("i32");
    const A = local("i32"), B = local("i32"), i = local("i32");
    const tsize = local("i32"), toffset = local("i32");
    const previousScore = local("i32"), nextScore = local("i32");
    const step = local(STOP);
    const schedView = {
      move: (target, source, count) => schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index) => schedule.at(toffset.add(index))
    };
    return [
      tran.set(randint.call(planner.NTRANS)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.lt(2), ret()),
      toffset.set(tran.mul(TSIZE)),
      step.set(schedView.at(randint.call(tsize))),
      req.set(step.req_id),
      deck.set(step.deck),
      A.set(-1),
      B.set(-1),
      loop(i.lt(tsize), [
        step.set(schedView.at(i)),
        ifElse(step.req_id.eq(req), ifElse(A.eq(-1), A.set(i), B.set(i))),
        i.iadd(1)
      ]),
      ifElse(A.eq(-1).or(B.eq(-1)), ret()),
      previousScore.set(ratings.at(tran)),
      schedView.move(A, A.add(1), B.sub(A).sub(1)),
      schedView.move(B.sub(1), B.add(1), tsize.sub(B).sub(1)),
      sched_size.at(tran).set(tsize.sub(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(acceptAnneal2.call(previousScore, nextScore, temperature), [assigned.at(req).set(0), ratings.at(tran).set(nextScore)], [
        schedView.move(B.add(1), B.sub(1), tsize.sub(B).sub(1)),
        schedView.move(A.add(1), A, B.sub(A).sub(1)),
        schedView.at(A).set({ req_id: req, is_load: 1, deck }),
        schedView.at(B).set({ req_id: req, is_load: 0, deck }),
        sched_size.at(tran).set(tsize)
      ])
    ];
  });
  const addRequest = func(["i32", "i32", "i32", "i32", "i32"], "void", (reqn, start, end, value, deadline) => requests.at(reqn).set({ start, end, value, deadline }));
  const bootstrap = func([], "void", () => {
    const tran = local("i32"), req = local("i32"), bestReq = local("i32");
    const offset = local("i32"), score = local("i32"), bestScore = local("i32");
    return forN(planner.NTRANS, (t) => [
      tran.set(t),
      offset.set(tran.mul(TSIZE)),
      bestReq.set(-1),
      bestScore.set(-INF),
      forN(planner.NREQS, (r) => [
        req.set(r),
        ifElse(assigned.at(req).eq(0), [
          schedule.at(offset).set({ req_id: req, is_load: 1, deck: 0 }),
          schedule.at(offset.add(1)).set({ req_id: req, is_load: 0, deck: 0 }),
          sched_size.at(tran).set(2),
          score.set(rateTran.call(tran)),
          ifElse(score.gt(bestScore), [bestScore.set(score), bestReq.set(req)]),
          sched_size.at(tran).set(0)
        ])
      ]),
      ifElse(bestReq.gt(-1).and(bestScore.gt(-12001)), [
        schedule.at(offset).set({ req_id: bestReq, is_load: 1, deck: 0 }),
        schedule.at(offset.add(1)).set({ req_id: bestReq, is_load: 0, deck: 0 }),
        sched_size.at(tran).set(2),
        assigned.at(bestReq).set(1),
        ratings.at(tran).set(bestScore)
      ])
    ]);
  });
  const search = func([], "void", () => {
    const temperature = local("i32");
    return [
      debug("debugger on.", 0),
      forN(TEMP_PHASES, (phase) => [
        temperature.set(i32(START_TEMP_CENTS).sub(phase.mul(START_TEMP_CENTS - END_TEMP_CENTS).div(TEMP_PHASES - 1))),
        forN(STEPS_PER_PHASE, () => [tryUnassign.call(temperature), tryAssign.call(temperature)])
      ])
    ];
  });
  const getStop = func(["i32", "i32"], STOP, (tran, index) => schedule.at(tran.mul(TSIZE).add(index)));
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

// src/planners/annealing_wasm_improved.ts
var TEMP_PHASES2 = 1000;
var END_TEMP_CENTS2 = 0;
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
var DEBUG2 = false;
function debug2(tag, value) {
  if (!DEBUG2)
    return [];
  return [log(tag, value)];
}
function checkedArray2(type, length) {
  const arr = array2(type, length);
  if (!DEBUG2)
    return arr;
  const { at, move } = arr;
  const checkIdx = func(["i32", "i32"], "i32", (i, n) => ifElse(i.lt(0).or(n.lt(0)).or(n.add(i).gt(arr.length)), trap("array bounds exceeded"), ret(i)));
  arr.at = (index) => at(checkIdx.call(index, 1));
  arr.move = (target, source, count) => move(checkIdx.call(target, count), checkIdx.call(source, count), count);
  return arr;
}
function forN2(n, body2) {
  const i = local("i32");
  return [i.set(0), loop(i.lt(n), [body2(i), i.iadd(1)])];
}
async function annealingWasmImproved(planner, options = {}) {
  const params = { ...defaultWasmSearchParams, ...options };
  const stepsPerPhase = Math.floor(params.steps / TEMP_PHASES2);
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
  const dists = checkedArray2("i32", planner.RSIZE);
  const requests = checkedArray2(REQ, planner.NREQS);
  const assigned = checkedArray2("u8", planner.NREQS);
  const schedule = checkedArray2(STOP, planner.NTRANS * TSIZE);
  const sched_size = checkedArray2("i16", planner.NTRANS);
  const ratings = checkedArray2("i32", planner.NTRANS);
  const tran_positions = checkedArray2("i16", planner.NTRANS);
  const randNext = func([], "i32", () => {
    return [
      randState.set(randState.xor(randState.shl(13))),
      randState.set(randState.xor(randState.shr(17))),
      randState.set(randState.xor(randState.shl(5))),
      ret(randState)
    ];
  });
  const randint = func(["i32"], "i32", (max) => i32(i64u(randNext.call()).mul(i64u(max)).shr(32n)));
  const acceptAnneal2 = func(["i32", "i32", "i32"], "i32", (previous, next, temperature) => [
    ifElse(previous.gt(next), ret(randint.call(1e6).lt(i32(exp(f32(next.sub(previous)).div(f32(temperature))).mul(1e6)))), ret(1))
  ]);
  const roadCost = func(["i32", "i32"], "i32", (from, to) => {
    const lo = local("i32"), index = local("i32");
    return [
      lo.set(to.add(from.sub(to).mul(from.lt(to)))),
      index.set(from.add(to).sub(lo).add(lo.mul(NPOINTS))),
      index.set(index.add(index.gt(planner.RSIZE).mul(i32(NPOINTS ** 2).sub(index.mul(2))))),
      ret(dists.at(index))
    ];
  });
  const tryAssign = func(["i32"], "void", (temperature) => {
    const tran = local("i32");
    const req_id = local("i32");
    const A = local("i32");
    const B = local("i32");
    const tmp = local("i32");
    const tsize = local("i32");
    const toffset = local("i32");
    const previousScore = local("i32");
    const nextScore = local("i32");
    const schedView = {
      move: (target, source, count) => schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index) => schedule.at(toffset.add(index))
    };
    return [
      tran.set(randint.call(planner.NTRANS)),
      req_id.set(randint.call(planner.NREQS)),
      ifElse(assigned.at(req_id).eq(1), ret()),
      toffset.set(tran.mul(TSIZE)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.gt(TSIZE - 2), ret()),
      previousScore.set(ratings.at(tran)),
      A.set(randint.call(tsize.add(1))),
      B.set(A.add(randint.call(4))),
      ifElse(B.gt(tsize), B.set(tsize)),
      schedView.move(B.add(2), B, tsize.sub(B)),
      schedView.move(A.add(1), A, B.sub(A)),
      tmp.set(randint.call(2)),
      schedView.at(A).set({ req_id, is_load: 1, deck: tmp }),
      schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp }),
      sched_size.at(tran).set(tsize.add(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(acceptAnneal2.call(previousScore, nextScore, temperature), [assigned.at(req_id).set(1), ratings.at(tran).set(nextScore)], [
        schedView.move(A, A.add(1), B.sub(A)),
        schedView.move(B, B.add(2), tsize.sub(B)),
        sched_size.at(tran).set(tsize)
      ])
    ];
  });
  const rateTran = func(["i32"], "i32", (tran) => {
    const reward = local("i32"), cost = local("i32"), elapsedMinutes = local("i32"), distance = local("i32"), pos = local("i32");
    const offset = local("i32"), size = local("i32"), i = local("i32");
    const deck0 = local("i32"), deck1 = local("i32"), deckSize0 = local("i32"), deckSize1 = local("i32");
    const deck = local("i32"), deckSize = local("i32"), req = local("i32"), nextPos = local("i32");
    const found = local("i32"), shift = local("i32"), lowerMask = local("i32");
    const step = local(STOP), request = local(REQ);
    return [
      pos.set(tran_positions.at(tran)),
      offset.set(tran.mul(TSIZE)),
      size.set(sched_size.at(tran)),
      loop(i.lt(size), [
        step.set(schedule.at(offset.add(i))),
        req.set(step.req_id),
        request.set(requests.at(req)),
        nextPos.set(ifElse(step.is_load, request.start, request.end)),
        distance.set(roadCost.call(pos, nextPos)),
        cost.iadd(distance.mul(KM_COST_CENTS)),
        elapsedMinutes.iadd(distance),
        pos.set(nextPos),
        deck.set(ifElse(step.deck, deck1, deck0)),
        deckSize.set(ifElse(step.deck, deckSize1, deckSize0)),
        ifElse(step.is_load, [
          ifElse(deckSize.gt(2), ret(-INF)),
          deck.set(deck.or(req.shl(deckSize.mul(10)))),
          deckSize.iadd(1)
        ], [
          found.set(-1),
          ifElse(deckSize.gt(0).and(deck.and(1023).eq(req)), found.set(0)),
          ifElse(found.eq(-1).and(deckSize.gt(1)).and(deck.shr(10).and(1023).eq(req)), found.set(1)),
          ifElse(found.eq(-1).and(deckSize.gt(2)).and(deck.shr(20).and(1023).eq(req)), found.set(2)),
          ifElse(found.eq(-1), ret(-INF)),
          cost.iadd(deckSize.sub(found).sub(1).mul(REORG_COST_CENTS)),
          shift.set(found.mul(10)),
          lowerMask.set(i32(1).shl(shift).sub(1)),
          deck.set(deck.and(lowerMask).or(deck.shr(shift.add(10)).shl(shift))),
          deckSize.isub(1),
          ifElse(elapsedMinutes.gt(request.deadline), [], reward.iadd(request.value))
        ]),
        ifElse(step.deck, [deck1.set(deck), deckSize1.set(deckSize)], [deck0.set(deck), deckSize0.set(deckSize)]),
        i.iadd(1)
      ]),
      ret(reward.sub(cost))
    ];
  });
  const tryUnassign = func(["i32"], "void", (temperature) => {
    const tran = local("i32"), req = local("i32"), deck = local("i32");
    const A = local("i32"), B = local("i32"), i = local("i32");
    const tsize = local("i32"), toffset = local("i32");
    const previousScore = local("i32"), nextScore = local("i32");
    const step = local(STOP);
    const schedView = {
      move: (target, source, count) => schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index) => schedule.at(toffset.add(index))
    };
    return [
      tran.set(randint.call(planner.NTRANS)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.lt(2), ret()),
      toffset.set(tran.mul(TSIZE)),
      step.set(schedView.at(randint.call(tsize))),
      req.set(step.req_id),
      deck.set(step.deck),
      A.set(-1),
      B.set(-1),
      loop(i.lt(tsize), [
        step.set(schedView.at(i)),
        ifElse(step.req_id.eq(req), ifElse(A.eq(-1), A.set(i), B.set(i))),
        i.iadd(1)
      ]),
      ifElse(A.eq(-1).or(B.eq(-1)), ret()),
      previousScore.set(ratings.at(tran)),
      schedView.move(A, A.add(1), B.sub(A).sub(1)),
      schedView.move(B.sub(1), B.add(1), tsize.sub(B).sub(1)),
      sched_size.at(tran).set(tsize.sub(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(acceptAnneal2.call(previousScore, nextScore, temperature), [assigned.at(req).set(0), ratings.at(tran).set(nextScore)], [
        schedView.move(B.add(1), B.sub(1), tsize.sub(B).sub(1)),
        schedView.move(A.add(1), A, B.sub(A).sub(1)),
        schedView.at(A).set({ req_id: req, is_load: 1, deck }),
        schedView.at(B).set({ req_id: req, is_load: 0, deck }),
        sched_size.at(tran).set(tsize)
      ])
    ];
  });
  const tryRelocate = func(["i32"], "void", (temperature) => {
    const src = local("i32"), dst = local("i32"), req = local("i32"), deck = local("i32");
    const A = local("i32"), B = local("i32"), C = local("i32"), D = local("i32"), i = local("i32");
    const srcSize = local("i32"), dstSize = local("i32"), srcOffset = local("i32"), dstOffset = local("i32");
    const previousScore = local("i32"), nextSrc = local("i32"), nextDst = local("i32"), step = local(STOP);
    const srcView = {
      move: (target, source, count) => schedule.move(srcOffset.add(target), srcOffset.add(source), count),
      at: (index) => schedule.at(srcOffset.add(index))
    };
    const dstView = {
      move: (target, source, count) => schedule.move(dstOffset.add(target), dstOffset.add(source), count),
      at: (index) => schedule.at(dstOffset.add(index))
    };
    return [
      src.set(randint.call(planner.NTRANS)),
      dst.set(randint.call(planner.NTRANS)),
      ifElse(src.eq(dst), ret()),
      srcSize.set(sched_size.at(src)),
      dstSize.set(sched_size.at(dst)),
      ifElse(srcSize.lt(2).or(dstSize.gt(TSIZE - 2)), ret()),
      srcOffset.set(src.mul(TSIZE)),
      dstOffset.set(dst.mul(TSIZE)),
      step.set(srcView.at(randint.call(srcSize))),
      req.set(step.req_id),
      deck.set(step.deck),
      A.set(-1),
      B.set(-1),
      loop(i.lt(srcSize), [
        step.set(srcView.at(i)),
        ifElse(step.req_id.eq(req), ifElse(A.eq(-1), A.set(i), B.set(i))),
        i.iadd(1)
      ]),
      ifElse(A.eq(-1).or(B.eq(-1)), ret()),
      previousScore.set(ratings.at(src).add(ratings.at(dst))),
      srcView.move(A, A.add(1), B.sub(A).sub(1)),
      srcView.move(B.sub(1), B.add(1), srcSize.sub(B).sub(1)),
      sched_size.at(src).set(srcSize.sub(2)),
      C.set(randint.call(dstSize.add(1))),
      D.set(C.add(randint.call(4))),
      ifElse(D.gt(dstSize), D.set(dstSize)),
      dstView.move(D.add(2), D, dstSize.sub(D)),
      dstView.move(C.add(1), C, D.sub(C)),
      dstView.at(C).set({ req_id: req, is_load: 1, deck }),
      dstView.at(D.add(1)).set({ req_id: req, is_load: 0, deck }),
      sched_size.at(dst).set(dstSize.add(2)),
      nextSrc.set(rateTran.call(src)),
      nextDst.set(rateTran.call(dst)),
      ifElse(acceptAnneal2.call(previousScore, nextSrc.add(nextDst), temperature), [ratings.at(src).set(nextSrc), ratings.at(dst).set(nextDst)], [
        dstView.move(C, C.add(1), D.sub(C)),
        dstView.move(D, D.add(2), dstSize.sub(D)),
        sched_size.at(dst).set(dstSize),
        srcView.move(B.add(1), B.sub(1), srcSize.sub(B).sub(1)),
        srcView.move(A.add(1), A, B.sub(A).sub(1)),
        srcView.at(A).set({ req_id: req, is_load: 1, deck }),
        srcView.at(B).set({ req_id: req, is_load: 0, deck }),
        sched_size.at(src).set(srcSize)
      ])
    ];
  });
  const tryNudgeStop = func(["i32"], "void", (temperature) => {
    const tran = local("i32"), size = local("i32"), offset = local("i32");
    const from = local("i32"), target = local("i32"), roll = local("i32");
    const first = local("i32"), end = local("i32"), i = local("i32");
    const previousScore = local("i32"), nextScore = local("i32");
    const selected = local(STOP), crossed = local(STOP);
    return [
      tran.set(randint.call(planner.NTRANS)),
      size.set(sched_size.at(tran)),
      ifElse(size.lt(2), ret()),
      offset.set(tran.mul(TSIZE)),
      from.set(randint.call(size)),
      selected.set(schedule.at(offset.add(from))),
      roll.set(randint.call(params.nudgeRadius * 2)),
      target.set(from.add(ifElse(roll.lt(params.nudgeRadius), roll.sub(params.nudgeRadius), roll.sub(params.nudgeRadius - 1)))),
      ifElse(target.lt(0), target.set(0)),
      ifElse(target.gt(size.sub(1)), target.set(size.sub(1))),
      ifElse(target.eq(from), ret()),
      ifElse(target.lt(from), [first.set(target), end.set(from)], [first.set(from.add(1)), end.set(target.add(1))]),
      i.set(first),
      loop(i.lt(end), [
        crossed.set(schedule.at(offset.add(i))),
        ifElse(crossed.req_id.eq(selected.req_id), ret()),
        i.iadd(1)
      ]),
      previousScore.set(ratings.at(tran)),
      ifElse(target.lt(from), schedule.move(offset.add(target.add(1)), offset.add(target), from.sub(target)), schedule.move(offset.add(from), offset.add(from.add(1)), target.sub(from))),
      schedule.at(offset.add(target)).set(selected),
      nextScore.set(rateTran.call(tran)),
      ifElse(acceptAnneal2.call(previousScore, nextScore, temperature), ratings.at(tran).set(nextScore), [
        ifElse(target.lt(from), schedule.move(offset.add(target), offset.add(target.add(1)), from.sub(target)), schedule.move(offset.add(from.add(1)), offset.add(from), target.sub(from))),
        schedule.at(offset.add(from)).set(selected)
      ])
    ];
  });
  const addRequest = func(["i32", "i32", "i32", "i32", "i32"], "void", (reqn, start, end, value, deadline) => requests.at(reqn).set({ start, end, value, deadline }));
  const bootstrap = func([], "void", () => {
    const tran = local("i32"), req = local("i32"), bestReq = local("i32");
    const offset = local("i32"), score = local("i32"), bestScore = local("i32");
    return forN2(planner.NTRANS, (t) => [
      tran.set(t),
      offset.set(tran.mul(TSIZE)),
      bestReq.set(-1),
      bestScore.set(-INF),
      forN2(planner.NREQS, (r) => [
        req.set(r),
        ifElse(assigned.at(req).eq(0), [
          schedule.at(offset).set({ req_id: req, is_load: 1, deck: 0 }),
          schedule.at(offset.add(1)).set({ req_id: req, is_load: 0, deck: 0 }),
          sched_size.at(tran).set(2),
          score.set(rateTran.call(tran)),
          ifElse(score.gt(bestScore), [bestScore.set(score), bestReq.set(req)]),
          sched_size.at(tran).set(0)
        ])
      ]),
      ifElse(bestReq.gt(-1).and(bestScore.gt(-12001)), [
        schedule.at(offset).set({ req_id: bestReq, is_load: 1, deck: 0 }),
        schedule.at(offset.add(1)).set({ req_id: bestReq, is_load: 0, deck: 0 }),
        sched_size.at(tran).set(2),
        assigned.at(bestReq).set(1),
        ratings.at(tran).set(bestScore)
      ])
    ]);
  });
  const search = func([], "void", () => {
    const temperature = local("i32"), move = local("i32");
    return [
      debug2("debugger on.", 0),
      forN2(TEMP_PHASES2, (phase) => [
        temperature.set(i32(params.startTemperature).sub(phase.mul(params.startTemperature - END_TEMP_CENTS2).div(TEMP_PHASES2 - 1))),
        forN2(stepsPerPhase, () => [
          move.set(randint.call(totalWeight)),
          ifElse(move.lt(assignEnd), tryAssign.call(temperature), ifElse(move.lt(unassignEnd), tryUnassign.call(temperature), ifElse(move.lt(nudgeEnd), tryNudgeStop.call(temperature), tryRelocate.call(temperature))))
        ])
      ])
    ];
  });
  const getStop = func(["i32", "i32"], STOP, (tran, index) => schedule.at(tran.mul(TSIZE).add(index)));
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

// src/planners/annealing.ts
var availableSolvers = {
  baseline: baselineAnnealing,
  improved: improvedAnnealing,
  wasm: annealingWasm,
  wasmImproved: annealingWasmImproved
};
var INITIAL_SOLVER = "wasmImproved";
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
  const solverSelect = document.createElement("select");
  for (const name of Object.keys(availableSolvers))
    solverSelect.add(new Option(name, name));
  solverSelect.value = INITIAL_SOLVER;
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
        annealingSession = createImprovedAnnealingSession(mod, 1900000);
        result = annealingSession.iterateForMs(10);
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
var LKW_COUNT = mkStored("LKW_COUNT", number, 5);
var REQUEST_COUNT = mkStored("REQUEST_COUNT", number, 20);
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

//# debugId=EC8452DDD6046CAB64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3dhc20vYXN0LnRzIiwgInNyYy93YXNtL2FuYWx5emUudHMiLCAic3JjL3dhc20vY29kZWdlbi50cyIsICJzcmMvd2FzbS9pbmRleC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3dhc20udHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZ193YXNtX2ltcHJvdmVkLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmcudHMiLCAic3JjL3ZpZXcvd2FzbXZpZXcudHMiLCAic3JjL2hhc2gudHMiLCAic3JjL3JlYWxfcm9hZG1hcC50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgTW9kdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG4vLyBpbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyBkaXYsIHAsIHN0eWxlIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMgfSBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgZ2VybWFueU91dGxpbmUgZnJvbSBcIi4vZ2VybWFueV9vdXRsaW5lLmpzb25cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG4gIGNvbnN0IHJlYWxNYXAgPSBcIkR1cmF0aW9uTWF0cml4XCIgaW4gcm9hZG1hcFxuICBjb25zdCB4cyA9IHJvYWRtYXAucG9pbnRzLm1hcChwb2ludCA9PiBwb2ludC54KVxuICBjb25zdCB5cyA9IHJvYWRtYXAucG9pbnRzLm1hcChwb2ludCA9PiBwb2ludC55KVxuICBjb25zdCBtaW5YID0gcmVhbE1hcCA/IDUuNSA6IDBcbiAgY29uc3QgbWF4WCA9IHJlYWxNYXAgPyAxNS41IDogTUFQU0laRVxuICBjb25zdCBtaW5ZID0gcmVhbE1hcCA/IDQ3LjIgOiAwXG4gIGNvbnN0IG1heFkgPSByZWFsTWFwID8gNTUuMSA6IE1BUFNJWkVcbiAgLy8gQXQgR2VybWFueSdzIGxhdGl0dWRlLCBvbmUgZGVncmVlIG9mIGxvbmdpdHVkZSBpcyBvbmx5IGFib3V0IDYzJSBvZiBvbmUgZGVncmVlXG4gIC8vIG9mIGxhdGl0dWRlLiBLZWVwIHRoYXQgZ2VvZ3JhcGhpYyBhc3BlY3QgcmF0aW8gaW5zdGVhZCBvZiBzdHJldGNoaW5nIGJvdGggYXhlcy5cbiAgY29uc3QgcHJvamVjdFggPSAoeDogbnVtYmVyKSA9PiByZWFsTWFwXG4gICAgPyAuMTM1ICsgLjczICogKHggLSBtaW5YKSAvIE1hdGgubWF4KG1heFggLSBtaW5YLCAxZS05KVxuICAgIDogeCAvIE1BUFNJWkVcbiAgY29uc3QgcHJvamVjdFkgPSAoeTogbnVtYmVyKSA9PiByZWFsTWFwXG4gICAgPyAuOTYgLSAuOTIgKiAoeSAtIG1pblkpIC8gTWF0aC5tYXgobWF4WSAtIG1pblksIDFlLTkpXG4gICAgOiB5IC8gTUFQU0laRVxuXG5cblxuICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpXG5cbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgXCIwIDAgMSAxXCIpXG5cbiAgbGV0IGVsZW1lbnRzID0gbmV3IE1hcDxhbnksIFNWR0VsZW1lbnQ+KClcbiAgbGV0IHNvdXJjZXMgPSBuZXcgTWFwPFNWR0VsZW1lbnQsIGFueT4oKVxuXG4gIGlmIChyZWFsTWFwKSB7XG4gICAgY29uc3Qgb3V0bGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicGF0aFwiKVxuICAgIG91dGxpbmUuc2V0QXR0cmlidXRlKFwiZFwiLCBnZXJtYW55T3V0bGluZS5tYXAocG9seWdvbiA9PlxuICAgICAgcG9seWdvbi5tYXAocmluZyA9PiByaW5nLm1hcCgoW2xvbiwgbGF0XSwgaW5kZXgpID0+XG4gICAgICAgIGAke2luZGV4ID09PSAwID8gXCJNXCIgOiBcIkxcIn0ke3Byb2plY3RYKGxvbiEpfSAke3Byb2plY3RZKGxhdCEpfWBcbiAgICAgICkuam9pbihcIiBcIikgKyBcIiBaXCIpLmpvaW4oXCIgXCIpXG4gICAgKS5qb2luKFwiIFwiKSlcbiAgICBvdXRsaW5lLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgXCIjZjFmNGYwXCIpXG4gICAgb3V0bGluZS5zZXRBdHRyaWJ1dGUoXCJmaWxsLXJ1bGVcIiwgXCJldmVub2RkXCIpXG4gICAgb3V0bGluZS5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgXCIjODI5MDg3XCIpXG4gICAgb3V0bGluZS5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAwM1wiKVxuICAgIG91dGxpbmUuc2V0QXR0cmlidXRlKFwidmVjdG9yLWVmZmVjdFwiLCBcIm5vbi1zY2FsaW5nLXN0cm9rZVwiKVxuICAgIG91dGxpbmUuc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiXG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChvdXRsaW5lKVxuICB9XG4gIFxuICAvLyBBIHJlYWwgcm9hZG1hcCdzIG1hdHJpeCBpcyBjb21wbGV0ZSwgc28gZHJhd2luZyBldmVyeSBtYXRyaXggcGFpciB3b3VsZCBjcmVhdGVcbiAgLy8gdGVucyBvZiB0aG91c2FuZHMgb2YgbGluZXMuIFN5bnRoZXRpYyBtYXBzIHN0aWxsIHNob3cgdGhlaXIgZ2VuZXJhdGVkIHJvYWRzLlxuICBmb3IgKGxldCB4ID0wIDsgIXJlYWxNYXAgJiYgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIHByb2plY3RYKGEueCksIHByb2plY3RZKGEueSksIHByb2plY3RYKGIueCksIHByb2plY3RZKGIueSkpLmVsXG4gICAgICBsZXQgaWQgPSBcInJvYWRcIityb2FkbWFwLnJvYWRJRFgoeCx5KVxuICAgICAgZWxlbWVudHMuc2V0KGlkLCBsaW5lKVxuICAgICAgc291cmNlcy5zZXQobGluZSwgaWQpXG4gICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxpbmUpXG4gICAgfVxuICB9XG4gIFxuICBmb3IgKGxldCB4ID0wOyB4PHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBsZXQgbG9jID0gcm9hZG1hcC5wb2ludHNbeF0hXG4gICAgbGV0IGNpcmNsZSA9IG1rU3ZnKFwiY2lyY2xlXCIsIHByb2plY3RYKGxvYy54KSwgcHJvamVjdFkobG9jLnkpKS5lbFxuICAgIGlmIChyZWFsTWFwKSBjaXJjbGUuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDA0XCIpXG4gICAgZWxlbWVudHMuc2V0KHgsIGNpcmNsZSlcbiAgICBzb3VyY2VzLnNldChjaXJjbGUsIHgpXG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChjaXJjbGUpXG4gIH1cblxuICBsZXQgaGludHM6IHtyZW1vdmU6KCk9PnZvaWR9W10gPSBbXVxuICBsZXQgaGlnaGxpZ2h0VmVyc2lvbiA9IDBcbiAgY29uc3QgZ2VvbWV0cnlDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBQcm9taXNlPG51bWJlcltdW10gfCBudWxsPj4oKVxuXG4gIGZ1bmN0aW9uIHJvdXRlR2VvbWV0cnkoZnJvbTogbnVtYmVyLCB0bzogbnVtYmVyKSB7XG4gICAgY29uc3QgYSA9IE1hdGgubWluKGZyb20sIHRvKSwgYiA9IE1hdGgubWF4KGZyb20sIHRvKVxuICAgIGNvbnN0IGtleSA9IGAke2F9LSR7Yn1gXG4gICAgbGV0IGdlb21ldHJ5ID0gZ2VvbWV0cnlDYWNoZS5nZXQoa2V5KVxuICAgIGlmICghZ2VvbWV0cnkpIHtcbiAgICAgIGdlb21ldHJ5ID0gZmV0Y2goYC4vcm91dGUtZ2VvbWV0cnk/ZnJvbT0ke2F9JnRvPSR7Yn1gKVxuICAgICAgICAudGhlbihhc3luYyByZXNwb25zZSA9PiByZXNwb25zZS5vayA/IChhd2FpdCByZXNwb25zZS5qc29uKCkgYXMge2Nvb3JkaW5hdGVzOiBudW1iZXJbXVtdfSkuY29vcmRpbmF0ZXMgOiBudWxsKVxuICAgICAgICAuY2F0Y2goKCkgPT4gbnVsbClcbiAgICAgIGdlb21ldHJ5Q2FjaGUuc2V0KGtleSwgZ2VvbWV0cnkpXG4gICAgfVxuICAgIHJldHVybiBnZW9tZXRyeS50aGVuKGNvb3JkaW5hdGVzID0+IGNvb3JkaW5hdGVzICYmIGZyb20gPiB0byA/IFsuLi5jb29yZGluYXRlc10ucmV2ZXJzZSgpIDogY29vcmRpbmF0ZXMpXG4gIH1cblxuICBmdW5jdGlvbiByb3V0ZVBhdGgoY29vcmRpbmF0ZXM6IG51bWJlcltdW10sIGNvbG9yOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJwYXRoXCIpXG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJkXCIsIGNvb3JkaW5hdGVzLm1hcCgoW2xvbiwgbGF0XSwgaW5kZXgpID0+XG4gICAgICBgJHtpbmRleCA9PT0gMCA/IFwiTVwiIDogXCJMXCJ9JHtwcm9qZWN0WChsb24hKX0gJHtwcm9qZWN0WShsYXQhKX1gXG4gICAgKS5qb2luKFwiIFwiKSlcbiAgICBwYXRoLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgXCJub25lXCIpXG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIuMDA2XCIpXG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJzdHJva2UtbGluZWNhcFwiLCBcInJvdW5kXCIpXG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJzdHJva2UtbGluZWpvaW5cIiwgXCJyb3VuZFwiKVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQocGF0aClcbiAgICByZXR1cm4geyByZW1vdmU6ICgpID0+IHBhdGgucmVtb3ZlKCkgfVxuICB9XG5cbiAgaGlnaHRMaWdodHMub251cGRhdGUoKG5ILG8pPT57XG4gICAgY29uc3QgdmVyc2lvbiA9ICsraGlnaGxpZ2h0VmVyc2lvblxuICAgIGhpbnRzLmZvckVhY2goZWw9PmVsLnJlbW92ZSgpKVxuICAgIGhpbnRzID0gW11cbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICBsZXQgQSA9IHJvYWRtYXAucG9pbnRzW2xhc3RdIVxuICAgICAgICAgIGxldCBCID0gcm9hZG1hcC5wb2ludHNbbmV4dF0hXG4gICAgICAgICAgbGV0IGxpbmUgPSBta1N2ZyhcImxpbmVcIiwgcHJvamVjdFgoQS54KSwgcHJvamVjdFkoQS55KSwgcHJvamVjdFgoQi54KSwgcHJvamVjdFkoQi55KSlcbiAgICAgICAgICBsaW5lLnNldENvbG9yKG4uY29sb3IgPz8gXCIjZmZjOTg4XCIpXG4gICAgICAgICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lLmVsKVxuICAgICAgICAgIGNvbnN0IGZhbGxiYWNrID0ge3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9XG4gICAgICAgICAgaGludHMucHVzaChmYWxsYmFjaylcbiAgICAgICAgICBpZiAocmVhbE1hcCAmJiBsYXN0ICE9PSBuZXh0KSB7XG4gICAgICAgICAgICB2b2lkIHJvdXRlR2VvbWV0cnkobGFzdCwgbmV4dCkudGhlbihjb29yZGluYXRlcyA9PiB7XG4gICAgICAgICAgICAgIGlmICh2ZXJzaW9uICE9PSBoaWdobGlnaHRWZXJzaW9uIHx8ICFjb29yZGluYXRlcykgcmV0dXJuXG4gICAgICAgICAgICAgIGZhbGxiYWNrLnJlbW92ZSgpXG4gICAgICAgICAgICAgIGhpbnRzID0gaGludHMuZmlsdGVyKGhpbnQgPT4gaGludCAhPT0gZmFsbGJhY2spXG4gICAgICAgICAgICAgIGhpbnRzLnB1c2gocm91dGVQYXRoKGNvb3JkaW5hdGVzLCBuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxhc3QgPSBuZXh0XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBpZiAocC5sb2dvKSB7XG4gICAgICAgICAgbGV0IHBvcyA9IHJvYWRtYXAucG9pbnRzW3AubnVtYmVyXSFcbiAgICAgICAgICBsZXQgZWwgPSBta1N2ZyhcInRleHRcIiwgcHJvamVjdFgocG9zLngpLCBwcm9qZWN0WShwb3MueSksIHAubG9nbylcbiAgICAgICAgICBpZiAocmVhbE1hcCkgZWwuZWwuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiLjAzNVwiKVxuICAgICAgICAgIGVsLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDAwXCIpXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChlbC5lbClcbiAgICAgICAgICBoaW50cy5wdXNoKGVsLmVsKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIGxldCBkdiA9IGRpdihzdHlsZSh7d2lkdGg6XCIxMDAlXCIsIGRpc3BsYXk6XCJmbGV4XCIsIGp1c3RpZnlDb250ZW50OlwiY2VudGVyXCIsIHBhZGRpbmc6IFwiMWVtXCJ9KSlcbiAgZHYuYXBwZW5kKGVsZW1lbnQpXG5cblxuICByZXR1cm4gZHZcbn1cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuICBmdW5jdGlvbiBjb25uZWN0KGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpe1xuICAgIGlmIChhID09PSBiKSByZXR1cm5cbiAgICBpZiAoZ2V0cm9hZChhLCBiKSAhPT0gMCkgcmV0dXJuXG4gICAgc2V0cm9hZChhLCBiLCBkaXN0KVxuICB9XG5cbiAgLy8gQnVpbGQgYSBjb25uZWN0ZWQgYmFja2JvbmUgYnkgcmVwZWF0ZWRseSBhdHRhY2hpbmcgdGhlIG5lYXJlc3QgdW5jb25uZWN0ZWQgcG9pbnQuXG4gIGNvbnN0IGNvbm5lY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIHdoaWxlIChjb25uZWN0ZWQuc2l6ZSA8IE5QT0lOVFMpe1xuICAgIGxldCBiZXN0QSA9IC0xXG4gICAgbGV0IGJlc3RCID0gLTFcbiAgICBsZXQgYmVzdEQgPSBJbmZpbml0eVxuXG4gICAgZm9yIChjb25zdCBhIG9mIGNvbm5lY3RlZCl7XG4gICAgICBmb3IgKGNvbnN0IG5laSBvZiBuZWlnaHNbYV0gPz8gW10pe1xuICAgICAgICBpZiAoY29ubmVjdGVkLmhhcyhuZWkuaSkpIGNvbnRpbnVlXG4gICAgICAgIGlmIChuZWkuZCA8IGJlc3REKXtcbiAgICAgICAgICBiZXN0QSA9IGFcbiAgICAgICAgICBiZXN0QiA9IG5laS5pXG4gICAgICAgICAgYmVzdEQgPSBuZWkuZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RBID09PSAtMSB8fCBiZXN0QiA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHJhbmRvbSBtYXBcIilcbiAgICBjb25uZWN0KGJlc3RBLCBiZXN0QiwgYmVzdEQpXG4gICAgY29ubmVjdGVkLmFkZChiZXN0QilcbiAgfVxuXG4gIC8vIEFkZCBhIGZldyBleHRyYSBsb2NhbCByb2FkcyBzbyB0aGUgbWFwIGlzIG5vdCBqdXN0IGEgdHJlZS5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGNvbnN0IGV4dHJhRWRnZXMgPSAyICsgcmFuZEludCgwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0cmFFZGdlczsgaSsrKXtcbiAgICAgIGNvbnN0IG54ID0gbmVpZ2hzW3hdPy5baV1cbiAgICAgIGlmICghbngpIGNvbnRpbnVlXG4gICAgICBjb25uZWN0KHgsIG54LmksIG54LmQpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuXG5leHBvcnQgY29uc3QgS01fQ09TVF9DRU5UUyA9IDUwO1xuZXhwb3J0IGNvbnN0IEFWR19TUEVFRF9LTUggPSA2MDtcbmV4cG9ydCBjb25zdCBSRU9SR19DT1NUX0NFTlRTID0gMTBfMDAwO1xuZXhwb3J0IGNvbnN0IElORiA9IDEgPDwgMzA7XG5cbmV4cG9ydCB0eXBlIFBhaXJJbmZvID0ge1xuICByZXE6IG51bWJlcjtcbiAgZmlyc3Q6IG51bWJlcjtcbiAgc2Vjb25kOiBudW1iZXI7XG4gIGRlY2s6IDAgfCAxO1xufTtcblxuZXhwb3J0IHR5cGUgQW5uZWFsaW5nU3RhdGUgPSB7XG4gIG1vZDogTW9kdWxlO1xuICBOUkVRUzogbnVtYmVyO1xuICBOVFJBTlM6IG51bWJlcjtcbiAgVFNJWkU6IG51bWJlcjtcbiAgcmVxUGlja3VwTG9jYXRpb25zOiBVaW50MTZBcnJheTtcbiAgcmVxRGVsaXZlcnlMb2NhdGlvbnM6IFVpbnQxNkFycmF5O1xuICByZXFEZWFkbGluZXM6IFVpbnQzMkFycmF5O1xuICByZXFWYWx1ZXM6IFVpbnQzMkFycmF5O1xuICB1bmFzc2lnbmVkOiBJbnQ4QXJyYXk7XG4gIHRyYW5TdGFydDogVWludDE2QXJyYXk7XG4gIHNjaGVkdWxlOiBVaW50MzJBcnJheTtcbiAgc2NoZWR1bGVTaXplczogVWludDE2QXJyYXk7XG4gIHNjaGVkdWxlUmF0aW5nczogSW50MzJBcnJheTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xvYWQoeDogbnVtYmVyKSB7XG4gIHJldHVybiB4ICYgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlY2soeDogbnVtYmVyKSB7XG4gIHJldHVybiAoKHggJiAyKSA+PiAxKSBhcyAwIHwgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlcSh4OiBudW1iZXIpIHtcbiAgcmV0dXJuICh4ICYgMHhmZmZmKSA+PiAyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9zKHg6IG51bWJlcikge1xuICByZXR1cm4geCA+PiAxNjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRBbm5lYWxpbmdTdGF0ZShtb2Q6IE1vZHVsZSwgc2VlZD86IEFubmVhbGluZ1Jlc3VsdCk6IEFubmVhbGluZ1N0YXRlIHtcbiAgY29uc3QgeyBOUkVRUywgcmVxdWVzdHMsIHN0YXJ0cG9zaXRpb25zLCBOVFJBTlMgfSA9IG1vZDtcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKE5SRVFTICogMi41ICsgMTApO1xuXG4gIHJldHVybiB7XG4gICAgbW9kLFxuICAgIE5SRVFTLFxuICAgIE5UUkFOUyxcbiAgICBUU0laRSxcbiAgICByZXFQaWNrdXBMb2NhdGlvbnM6IG5ldyBVaW50MTZBcnJheShyZXF1ZXN0cy5tYXAoKHIpID0+IHIuc3RhcnRQb2ludCkpLFxuICAgIHJlcURlbGl2ZXJ5TG9jYXRpb25zOiBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiByLmVuZFBvaW50KSksXG4gICAgcmVxRGVhZGxpbmVzOiBuZXcgVWludDMyQXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiBNYXRoLmZsb29yKHIuZGVhZGxpbmVfaCAqIDYwKSkpLFxuICAgIHJlcVZhbHVlczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gTWF0aC5yb3VuZChyLnZhbHVlX2V1ciAqIDEwMCkpKSxcbiAgICB1bmFzc2lnbmVkOiBzZWVkID8gbmV3IEludDhBcnJheShzZWVkLnVuYXNzaWduZWQpIDogbmV3IEludDhBcnJheShyZXF1ZXN0cy5tYXAoKCkgPT4gMSkpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHN0YXJ0cG9zaXRpb25zKSxcbiAgICBzY2hlZHVsZTogc2VlZCA/IG5ldyBVaW50MzJBcnJheShzZWVkLnNjaGVkdWxlKSA6IG5ldyBVaW50MzJBcnJheShUU0laRSAqIE5UUkFOUyksXG4gICAgc2NoZWR1bGVTaXplczogc2VlZCA/IG5ldyBVaW50MTZBcnJheShzZWVkLnNjaGVkdWxlU2l6ZXMpIDogbmV3IFVpbnQxNkFycmF5KE5UUkFOUyksXG4gICAgc2NoZWR1bGVSYXRpbmdzOiBzZWVkID8gbmV3IEludDMyQXJyYXkoc2VlZC5zY2hlZHVsZVJhdGluZ3MpIDogbmV3IEludDMyQXJyYXkoTlRSQU5TKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJvdXRlT2Zmc2V0KHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyKSB7XG4gIHJldHVybiB0cmFuICogc3RhdGUuVFNJWkU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRSZXEoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIGlkeDogbnVtYmVyLCBpc0xvYWRCaXQ6IDEgfCAwLCBkZWNrOiAwIHwgMSwgcmVxOiBudW1iZXIsIHBvczogbnVtYmVyKSB7XG4gIHN0YXRlLnNjaGVkdWxlW3JvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKSArIGlkeF0gPSAoaXNMb2FkQml0IDw8IDApIHwgKGRlY2sgPDwgMSkgfCAocmVxIDw8IDIpIHwgKHBvcyA8PCAxNik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzY29yZVJvdXRlKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyKSB7XG4gIGxldCByZXdhcmQgPSAwO1xuICBsZXQgY29zdCA9IDA7XG4gIGxldCBlbGFwc2VkTWludXRlcyA9IDA7XG4gIGNvbnN0IGRlY2tzOiBbbnVtYmVyW10sIG51bWJlcltdXSA9IFtbXSwgW11dO1xuICBsZXQgcG9zID0gc3RhdGUudHJhblN0YXJ0W3RyYW5dITtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7IGkrKykge1xuICAgIGNvbnN0IHN0ZXAgPSBzdGF0ZS5zY2hlZHVsZVtvZmZzZXQgKyBpXSE7XG4gICAgY29uc3QgbG9hZCA9IGlzTG9hZChzdGVwKTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RlcCk7XG4gICAgY29uc3QgbmV4dFBvcyA9IGdldFBvcyhzdGVwKTtcbiAgICBjb25zdCBkaXN0YW5jZSA9IHN0YXRlLm1vZC5yb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dFBvcyk7XG4gICAgY29zdCArPSBkaXN0YW5jZSAqIEtNX0NPU1RfQ0VOVFM7XG4gICAgZWxhcHNlZE1pbnV0ZXMgKz0gZGlzdGFuY2UgKiA2MCAvIEFWR19TUEVFRF9LTUg7XG4gICAgcG9zID0gbmV4dFBvcztcblxuICAgIGlmIChsb2FkKSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgZGVjay5wdXNoKHJlcSk7XG4gICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSByZXR1cm4gLUlORjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2dldERlY2soc3RlcCldITtcbiAgICAgIGNvbnN0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpO1xuICAgICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiAtSU5GO1xuICAgICAgY29zdCArPSAoZGVjay5sZW5ndGggLSBpZHggLSAxKSAqIFJFT1JHX0NPU1RfQ0VOVFM7XG4gICAgICBkZWNrLnNwbGljZShpZHgsIDEpO1xuICAgICAgaWYgKGVsYXBzZWRNaW51dGVzIDw9IHN0YXRlLnJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHN0YXRlLnJlcVZhbHVlc1tyZXFdITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV3YXJkIC0gY29zdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hBbGxSYXRpbmdzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSkge1xuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHN0YXRlLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgc3RhdGUuc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJvb3RzdHJhcEVtcHR5Um91dGVzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4TG9zcyA9IDEyXzAwMCkge1xuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHN0YXRlLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgaWYgKHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gIT09IDApIGNvbnRpbnVlO1xuXG4gICAgbGV0IGJlc3RSZXEgPSAtMTtcbiAgICBsZXQgYmVzdFNjb3JlID0gLUlORjtcblxuICAgIGZvciAobGV0IHJlcSA9IDA7IHJlcSA8IHN0YXRlLk5SRVFTOyByZXErKykge1xuICAgICAgaWYgKCFzdGF0ZS51bmFzc2lnbmVkW3JlcV0pIGNvbnRpbnVlO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIDAsIDAsIDAsIHJlcSk7XG4gICAgICBjb25zdCBzY29yZSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIDAsIDEpO1xuICAgICAgaWYgKHNjb3JlID4gYmVzdFNjb3JlKSB7XG4gICAgICAgIGJlc3RTY29yZSA9IHNjb3JlO1xuICAgICAgICBiZXN0UmVxID0gcmVxO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChiZXN0UmVxID09PSAtMSB8fCBiZXN0U2NvcmUgPCAtbWF4TG9zcykgY29udGludWU7XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgMCwgMCwgMCwgYmVzdFJlcSk7XG4gICAgc3RhdGUuc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gYmVzdFNjb3JlO1xuICAgIHN0YXRlLnVuYXNzaWduZWRbYmVzdFJlcV0gPSAwO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRTdG9wcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIsIGRlY2s6IDAgfCAxLCByZXE6IG51bWJlcikge1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG4gIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSA9IHNpemUgKyAyO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIGVuZCArIDIsIG9mZnNldCArIGVuZCwgb2Zmc2V0ICsgc2l6ZSk7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgZW5kICsgMSk7XG4gIHNldFJlcShzdGF0ZSwgdHJhbiwgc3RhcnQsIDEsIGRlY2ssIHJlcSwgc3RhdGUucmVxUGlja3VwTG9jYXRpb25zW3JlcV0hKTtcbiAgc2V0UmVxKHN0YXRlLCB0cmFuLCBlbmQgKyAxLCAwLCBkZWNrLCByZXEsIHN0YXRlLnJlcURlbGl2ZXJ5TG9jYXRpb25zW3JlcV0hKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVN0b3BzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG4gIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSA9IHNpemUgLSAyO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIHN0YXJ0LCBvZmZzZXQgKyBzdGFydCArIDEsIG9mZnNldCArIGVuZCk7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kIC0gMSwgb2Zmc2V0ICsgZW5kICsgMSwgb2Zmc2V0ICsgc2l6ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUGFpckluUm91dGUoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHJlcTogbnVtYmVyKTogUGFpckluZm8gfCBudWxsIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIGxldCBmaXJzdCA9IC0xO1xuICBsZXQgc2Vjb25kID0gLTE7XG4gIGxldCBkZWNrOiAwIHwgMSA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICBjb25zdCBzdGVwID0gc3RhdGUuc2NoZWR1bGVbb2Zmc2V0ICsgaV0hO1xuICAgIGlmIChnZXRSZXEoc3RlcCkgIT09IHJlcSkgY29udGludWU7XG4gICAgaWYgKGZpcnN0ID09PSAtMSkge1xuICAgICAgZmlyc3QgPSBpO1xuICAgICAgZGVjayA9IGdldERlY2soc3RlcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlY29uZCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoZmlyc3QgPT09IC0xIHx8IHNlY29uZCA9PT0gLTEpIHJldHVybiBudWxsO1xuICByZXR1cm4geyByZXEsIGZpcnN0LCBzZWNvbmQsIGRlY2sgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhbXBsZVVuYXNzaWduZWRSZXEoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBtYXhBdHRlbXB0cyA9IDI0KTogbnVtYmVyIHwgbnVsbCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4QXR0ZW1wdHM7IGkrKykge1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgc3RhdGUuTlJFUVMpO1xuICAgIGlmIChzdGF0ZS51bmFzc2lnbmVkW3JlcV0pIHJldHVybiByZXE7XG4gIH1cblxuICBmb3IgKGxldCByZXEgPSAwOyByZXEgPCBzdGF0ZS5OUkVRUzsgcmVxKyspIHtcbiAgICBpZiAoc3RhdGUudW5hc3NpZ25lZFtyZXFdKSByZXR1cm4gcmVxO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBtYXhBdHRlbXB0cyA9IDI0KTogeyB0cmFuOiBudW1iZXI7IHBhaXI6IFBhaXJJbmZvIH0gfCBudWxsIHtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCBtYXhBdHRlbXB0czsgYXR0ZW1wdCsrKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgc3RhdGUuTlRSQU5TKTtcbiAgICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNpemUgPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCBpZHggPSByYW5kSW50KDAsIHNpemUpO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbikgKyBpZHhdISk7XG4gICAgY29uc3QgcGFpciA9IGZpbmRQYWlySW5Sb3V0ZShzdGF0ZSwgdHJhbiwgcmVxKTtcbiAgICBpZiAocGFpcikgcmV0dXJuIHsgdHJhbiwgcGFpciB9O1xuICB9XG5cbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2l6ZSA8IDIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbildISk7XG4gICAgY29uc3QgcGFpciA9IGZpbmRQYWlySW5Sb3V0ZShzdGF0ZSwgdHJhbiwgcmVxKTtcbiAgICBpZiAocGFpcikgcmV0dXJuIHsgdHJhbiwgcGFpciB9O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhY2NlcHRBbm5lYWwocHJldlNjb3JlOiBudW1iZXIsIG5leHRTY29yZTogbnVtYmVyLCB0ZW1wOiBudW1iZXIpIHtcbiAgaWYgKG5leHRTY29yZSA+PSBwcmV2U2NvcmUpIHJldHVybiB0cnVlO1xuICBjb25zdCBkZWx0YSA9IHByZXZTY29yZSAtIG5leHRTY29yZTtcbiAgcmV0dXJuIHJhbmRvbSgpIDwgTWF0aC5leHAoLWRlbHRhIC8gTWF0aC5tYXgodGVtcCwgMC4wMDEpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgZWxhcHNlZE1zOiBudW1iZXIpOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4ge1xuICAgIHNjaGVkdWxlOiBzdGF0ZS5zY2hlZHVsZSxcbiAgICBzY2hlZHVsZVNpemVzOiBzdGF0ZS5zY2hlZHVsZVNpemVzLFxuICAgIHRyYW5TdGFydDogc3RhdGUudHJhblN0YXJ0LFxuICAgIFRTSVpFOiBzdGF0ZS5UU0laRSxcbiAgICBzY2hlZHVsZVJhdGluZ3M6IHN0YXRlLnNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkOiBzdGF0ZS51bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiBzdGF0ZS5zY2hlZHVsZVJhdGluZ3MucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCksXG4gIH07XG59XG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQge1xuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgZ2V0RGVjayxcbiAgZ2V0UmVxLFxuICBpbml0QW5uZWFsaW5nU3RhdGUsXG4gIGluc2VydFN0b3BzLFxuICByZW1vdmVTdG9wcyxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxuZXhwb3J0IHR5cGUgQW5uZWFsaW5nUmVzdWx0ID0ge1xuICBzY2hlZHVsZTogVWludDMyQXJyYXk7XG4gIHNjaGVkdWxlU2l6ZXM6IFVpbnQxNkFycmF5O1xuICB0cmFuU3RhcnQ6IFVpbnQxNkFycmF5O1xuICBUU0laRTogbnVtYmVyO1xuICBzY2hlZHVsZVJhdGluZ3M6IEludDMyQXJyYXk7XG4gIHVuYXNzaWduZWQ6IEludDhBcnJheTtcbiAgZWxhcHNlZE1zOiBudW1iZXI7XG4gIHRvdGFsU2NvcmU6IG51bWJlcjtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlbGluZUFubmVhbGluZyhtb2Q6IE1vZHVsZSwgc3RlcHMgPSAxXzYwMF8wMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QpO1xuICBjb25zdCB7IE5SRVFTLCBOVFJBTlMsIFRTSVpFLCBzY2hlZHVsZSwgc2NoZWR1bGVTaXplcywgc2NoZWR1bGVSYXRpbmdzLCB1bmFzc2lnbmVkIH0gPSBzdGF0ZTtcblxuICBsZXQgc3RhcnRUZW1wID0gNV8wMDA7XG4gIGxldCB0ZW1wID0gc3RhcnRUZW1wO1xuXG4gIGJvb3RzdHJhcEVtcHR5Um91dGVzKHN0YXRlKTtcblxuICBmdW5jdGlvbiBhY2NlcHQocHJldlJhdGluZzogbnVtYmVyLCBuZXh0UmF0aW5nOiBudW1iZXIpIHtcbiAgICBpZiAobmV4dFJhdGluZyA+PSBwcmV2UmF0aW5nKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gcmFuZG9tKCkgPCBNYXRoLmV4cCgobmV4dFJhdGluZyAtIHByZXZSYXRpbmcpIC8gTWF0aC5tYXgodGVtcCwgMC4wMDEpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnbigpIHtcbiAgICBjb25zdCB0cmFuID0gcmFuZEludCgwLCBOVFJBTlMpO1xuICAgIGNvbnN0IHNjaGVkU2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNjaGVkU2l6ZSArIDEpO1xuICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzY2hlZFNpemUsIHJhbmRJbnQoMCwgNCkgKyBhKTtcbiAgICBjb25zdCByZXEgPSByYW5kSW50KDAsIE5SRVFTKTtcbiAgICBpZiAoIXVuYXNzaWduZWRbcmVxXSkgcmV0dXJuO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIsIHJhbmRvbSgpID4gMC41ID8gMSA6IDAsIHJlcSk7XG4gICAgY29uc3QgbmV3UmF0aW5nID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgaWYgKGFjY2VwdChzY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBuZXdSYXRpbmcpKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbdHJhbl0gPSBuZXdSYXRpbmc7XG4gICAgICB1bmFzc2lnbmVkW3JlcV0gPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVVuYXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNjaGVkU2l6ZSA8IDIpIHJldHVybjtcbiAgICBjb25zdCBpZHggPSByYW5kSW50KDAsIHNjaGVkU2l6ZSk7XG4gICAgY29uc3QgaXRlbSA9IHNjaGVkdWxlW3RyYW4gKiBUU0laRSArIGlkeF0hO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShpdGVtKTtcblxuICAgIGNvbnN0IGFiOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZWRTaXplOyBpKyspIHtcbiAgICAgIGlmIChnZXRSZXEoc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaV0hKSA9PT0gcmVxKSBhYi5wdXNoKGkpO1xuICAgIH1cbiAgICBpZiAoYWIubGVuZ3RoICE9PSAyKSByZXR1cm47XG5cbiAgICBjb25zdCBbYSwgYl0gPSBhYiBhcyBbbnVtYmVyLCBudW1iZXJdO1xuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiIC0gMSwgZ2V0RGVjayhpdGVtKSBhcyAwIHwgMSwgcmVxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RlcHM7IGkrKykge1xuICAgIHRlbXAgPSAoMSAtIGkgLyBzdGVwcykgKiBzdGFydFRlbXA7XG4gICAgdHJ5VW5hc3NpZ24oKTtcbiAgICB0cnlBc3NpZ24oKTtcbiAgfVxuXG4gIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgRGF0ZS5ub3coKSAtIHN0YXJ0ZWRBdCk7XG59XG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHsgYmFzZWxpbmVBbm5lYWxpbmcgfSBmcm9tIFwiLi9hbm5lYWxpbmdfYmFzZWxpbmVcIjtcbmltcG9ydCB7XG4gIGFjY2VwdEFubmVhbCxcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMsXG4gIGluaXRBbm5lYWxpbmdTdGF0ZSxcbiAgaW5zZXJ0U3RvcHMsXG4gIHR5cGUgUGFpckluZm8sXG4gIHJlbW92ZVN0b3BzLFxuICBzYW1wbGVBc3NpZ25lZFBhaXIsXG4gIHNhbXBsZVVuYXNzaWduZWRSZXEsXG4gIHNjb3JlUm91dGUsXG4gIHRvQW5uZWFsaW5nUmVzdWx0LFxufSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbnR5cGUgSW1wcm92ZWRPcHRpb25zID1cbiAgfCB7IHN0ZXBzOiBudW1iZXI7IGJ1ZGdldE1zPzogbmV2ZXIgfVxuICB8IHsgYnVkZ2V0TXM6IG51bWJlcjsgc3RlcHM/OiBuZXZlciB9O1xuXG5leHBvcnQgdHlwZSBJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24gPSB7XG4gIGl0ZXJhdGVTdGVwczogKHN0ZXBzOiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbiAgaXRlcmF0ZUZvck1zOiAoYnVkZ2V0TXM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBnZXRSZXN1bHQ6ICgpID0+IEFubmVhbGluZ1Jlc3VsdDtcbiAgcmVoZWF0OiAoZmFjdG9yPzogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZDogTW9kdWxlLCB0YXJnZXRTdGVwcyA9IDE1MDAwMCk6IEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB7XG4gIGNvbnN0IHdhcm11cFN0ZXBzID0gTWF0aC5taW4oTWF0aC5tYXgoMjAwMDAsIE1hdGguZmxvb3IodGFyZ2V0U3RlcHMgKiAwLjIpKSwgNTAwMDApO1xuICBjb25zdCB3YXJtdXAgPSBiYXNlbGluZUFubmVhbGluZyhtb2QsIHdhcm11cFN0ZXBzKTtcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kLCB3YXJtdXApO1xuICBjb25zdCB7IE5UUkFOUywgc2NoZWR1bGVTaXplcywgc2NoZWR1bGVSYXRpbmdzLCB1bmFzc2lnbmVkIH0gPSBzdGF0ZTtcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGxldCBzdGFydFRlbXAgPSA2XzAwMDtcbiAgbGV0IGVuZFRlbXAgPSAyNTtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduU2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwgeyB0cmFuOiBudW1iZXI7IHJlcTogbnVtYmVyOyBhOiBudW1iZXI7IGI6IG51bWJlcjsgZGVjazogMCB8IDE7IHNjb3JlOiBudW1iZXIgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgcmVxID0gc2FtcGxlVW5hc3NpZ25lZFJlcShzdGF0ZSk7XG4gICAgICBpZiAocmVxID09IG51bGwpIGJyZWFrO1xuXG4gICAgICBjb25zdCB0cmFuID0gcmFuZEludCgwLCBOVFJBTlMpO1xuICAgICAgY29uc3Qgc2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2l6ZSArIDEpO1xuICAgICAgY29uc3QgYiA9IE1hdGgubWluKHNpemUsIGEgKyByYW5kSW50KDAsIE1hdGgubWluKDYsIHNpemUgLSBhICsgMSkpKTtcbiAgICAgIGNvbnN0IGRlY2sgPSAocmFuZG9tKCkgPiAwLjUgPyAxIDogMCkgYXMgMCB8IDE7XG5cbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiLCBkZWNrLCByZXEpO1xuICAgICAgY29uc3QgbmV3U2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBuZXdTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHsgdHJhbiwgcmVxLCBhLCBiLCBkZWNrLCBzY29yZTogbmV3U2NvcmUgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuYSwgYmVzdC5iLCBiZXN0LmRlY2ssIGJlc3QucmVxKTtcbiAgICBpZiAoYWNjZXB0QW5uZWFsKHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dISwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dID0gYmVzdC5zY29yZTtcbiAgICAgIHVuYXNzaWduZWRbYmVzdC5yZXFdID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5hLCBiZXN0LmIgKyAxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlVbmFzc2lnblNhbXBsZWQoc2FtcGxlcyA9IDYpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHsgdHJhbjogbnVtYmVyOyBwYWlyOiBQYWlySW5mbzsgc2NvcmU6IG51bWJlciB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuICAgICAgY29uc3QgeyB0cmFuLCBwYWlyIH0gPSBjaG9zZW47XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQpO1xuICAgICAgY29uc3QgbmV3U2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCAtIDEsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgbmV3U2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7IHRyYW4sIHBhaXIsIHNjb3JlOiBuZXdTY29yZSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpZiAoYWNjZXB0QW5uZWFsKHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dISwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dID0gYmVzdC5zY29yZTtcbiAgICAgIHVuYXNzaWduZWRbYmVzdC5wYWlyLnJlcV0gPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5UmVsb2NhdGVTYW1wbGVkKHNhbXBsZXMgPSA4KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7XG4gICAgICBzcmM6IG51bWJlcjtcbiAgICAgIGRzdDogbnVtYmVyO1xuICAgICAgcGFpcjogUGFpckluZm87XG4gICAgICBpbnNlcnRBOiBudW1iZXI7XG4gICAgICBpbnNlcnRCOiBudW1iZXI7XG4gICAgICBzY29yZTogbnVtYmVyO1xuICAgICAgb2xkU2NvcmU6IG51bWJlcjtcbiAgICB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuXG4gICAgICBjb25zdCB7IHRyYW46IHNyYywgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgY29uc3QgZHN0ID0gcmFuZEludCgwLCBOVFJBTlMpO1xuICAgICAgY29uc3Qgb2xkU2NvcmUgPSBzcmMgPT09IGRzdFxuICAgICAgICA/IHNjaGVkdWxlUmF0aW5nc1tzcmNdIVxuICAgICAgICA6IHNjaGVkdWxlUmF0aW5nc1tzcmNdISArIHNjaGVkdWxlUmF0aW5nc1tkc3RdITtcblxuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHNyYywgcGFpci5maXJzdCwgcGFpci5zZWNvbmQpO1xuXG4gICAgICBjb25zdCBkc3RTaXplID0gc2NoZWR1bGVTaXplc1tkc3RdITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIGRzdFNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihkc3RTaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBkc3RTaXplIC0gYSArIDEpKSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgZHN0LCBhLCBiLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgY29uc3QgY2FuZGlkYXRlU2NvcmUgPSBzcmMgPT09IGRzdFxuICAgICAgICA/IHNjb3JlUm91dGUoc3RhdGUsIHNyYylcbiAgICAgICAgOiBzY29yZVJvdXRlKHN0YXRlLCBzcmMpICsgc2NvcmVSb3V0ZShzdGF0ZSwgZHN0KTtcblxuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGRzdCwgYSwgYiArIDEpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHNyYywgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IGNhbmRpZGF0ZVNjb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgIHNyYyxcbiAgICAgICAgICBkc3QsXG4gICAgICAgICAgcGFpcixcbiAgICAgICAgICBpbnNlcnRBOiBhLFxuICAgICAgICAgIGluc2VydEI6IGIsXG4gICAgICAgICAgc2NvcmU6IGNhbmRpZGF0ZVNjb3JlLFxuICAgICAgICAgIG9sZFNjb3JlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3Quc3JjLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQpO1xuICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LmRzdCwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcblxuICAgIGlmIChhY2NlcHRBbm5lYWwoYmVzdC5vbGRTY29yZSwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIGlmIChiZXN0LnNyYyA9PT0gYmVzdC5kc3QpIHtcbiAgICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3Quc3JjXSA9IHNjb3JlUm91dGUoc3RhdGUsIGJlc3Quc3JjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnNyY10gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LnNyYyk7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LmRzdF0gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LmRzdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LmRzdCwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnNyYywgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVJlaW5zZXJ0U2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwge1xuICAgICAgdHJhbjogbnVtYmVyO1xuICAgICAgcGFpcjogUGFpckluZm87XG4gICAgICBpbnNlcnRBOiBudW1iZXI7XG4gICAgICBpbnNlcnRCOiBudW1iZXI7XG4gICAgICBzY29yZTogbnVtYmVyO1xuICAgIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IGNob3NlbiA9IHNhbXBsZUFzc2lnbmVkUGFpcihzdGF0ZSk7XG4gICAgICBpZiAoIWNob3NlbikgYnJlYWs7XG5cbiAgICAgIGNvbnN0IHsgdHJhbiwgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcblxuICAgICAgY29uc3Qgc2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2l6ZSArIDEpO1xuICAgICAgY29uc3QgYiA9IE1hdGgubWluKHNpemUsIGEgKyByYW5kSW50KDAsIE1hdGgubWluKDYsIHNpemUgLSBhICsgMSkpKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgY29uc3QgY2FuZGlkYXRlU2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcblxuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCAtIDEsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgY2FuZGlkYXRlU2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7XG4gICAgICAgICAgdHJhbixcbiAgICAgICAgICBwYWlyLFxuICAgICAgICAgIGluc2VydEE6IGEsXG4gICAgICAgICAgaW5zZXJ0QjogYixcbiAgICAgICAgICBzY29yZTogY2FuZGlkYXRlU2NvcmUsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQpO1xuICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG5cbiAgICBpZiAoYWNjZXB0QW5uZWFsKHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dISwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dID0gYmVzdC5zY29yZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzZXNzaW9uU3RhcnRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgbGV0IGkgPSAwO1xuICBjb25zdCB0ZW1wRmxvb3IgPSAxNTA7XG4gIGNvbnN0IHJlaGVhdFRlbXAgPSAyXzI1MDtcblxuICBmdW5jdGlvbiBydW5JdGVyYXRpb25zKGl0ZXJhdGlvbkJ1ZGdldDogbnVtYmVyLCBkZWFkbGluZSA9IEluZmluaXR5KSB7XG4gICAgY29uc3QgZW5kSXRlcmF0aW9uID0gTWF0aC5taW4odGFyZ2V0U3RlcHMsIGkgKyBpdGVyYXRpb25CdWRnZXQpO1xuICAgIHdoaWxlIChpIDwgZW5kSXRlcmF0aW9uKSB7XG4gICAgICBpZiAoKGkgJiAyMDQ3KSA9PT0gMCAmJiBEYXRlLm5vdygpID49IGRlYWRsaW5lKSBicmVhaztcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IHN0YXJ0VGVtcCAqIE1hdGgucG93KGVuZFRlbXAgLyBzdGFydFRlbXAsIHByb2dyZXNzKTtcblxuICAgICAgY29uc3QgciA9IHJhbmRvbSgpO1xuICAgICAgaWYgKHIgPCAwLjQpIHRyeUFzc2lnblNhbXBsZWQoKTtcbiAgICAgIGVsc2UgaWYgKHIgPCAwLjU1KSB0cnlVbmFzc2lnblNhbXBsZWQoKTtcbiAgICAgIGVsc2UgaWYgKHIgPCAwLjg1KSB0cnlSZWluc2VydFNhbXBsZWQoKTtcbiAgICAgIGVsc2UgdHJ5UmVsb2NhdGVTYW1wbGVkKCk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcnVuVGltZWRDaHVuayhidWRnZXRNczogbnVtYmVyKSB7XG4gICAgY29uc3QgZGVhZGxpbmUgPSBEYXRlLm5vdygpICsgYnVkZ2V0TXM7XG5cbiAgICB3aGlsZSAoRGF0ZS5ub3coKSA8IGRlYWRsaW5lKSB7XG4gICAgICBjb25zdCBwcm9ncmVzcyA9IGkgLyB0YXJnZXRTdGVwcztcbiAgICAgIHRlbXAgPSBNYXRoLm1heCh0ZW1wRmxvb3IsIHN0YXJ0VGVtcCAqIE1hdGgucG93KGVuZFRlbXAgLyBzdGFydFRlbXAsIE1hdGgubWluKDEsIHByb2dyZXNzKSkpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcblxuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlc3VsdCgpIHtcbiAgICByZXR1cm4gdG9Bbm5lYWxpbmdSZXN1bHQoc3RhdGUsIHdhcm11cC5lbGFwc2VkTXMgKyAoRGF0ZS5ub3coKSAtIHNlc3Npb25TdGFydGVkQXQpKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaXRlcmF0ZVN0ZXBzKHN0ZXBzKSB7XG4gICAgICBydW5JdGVyYXRpb25zKHN0ZXBzKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGl0ZXJhdGVGb3JNcyhidWRnZXRNcykge1xuICAgICAgcnVuVGltZWRDaHVuayhidWRnZXRNcyk7XG4gICAgICByZXR1cm4gZ2V0UmVzdWx0KCk7XG4gICAgfSxcbiAgICBnZXRSZXN1bHQsXG4gICAgcmVoZWF0KGZhY3RvciA9IDEpIHtcbiAgICAgIHRlbXAgPSBNYXRoLm1heCh0ZW1wLCByZWhlYXRUZW1wICogZmFjdG9yKTtcbiAgICAgIC8vIFB1bGwgdGhlIHNlYXJjaCBzbGlnaHRseSBiYWNrIGZyb20gdGhlIGNvbGQgZW5kIG9mIHRoZSBzY2hlZHVsZS5cbiAgICAgIGkgPSBNYXRoLm1heCgwLCBpIC0gTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMDggKiBmYWN0b3IpKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ0NvcmUobW9kOiBNb2R1bGUsIG9wdGlvbnM6IEltcHJvdmVkT3B0aW9ucyk6IEFubmVhbGluZ1Jlc3VsdCB7XG4gIGNvbnN0IHRhcmdldFN0ZXBzID0gb3B0aW9ucy5zdGVwcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5zdGVwcyA6IE1hdGgubWF4KDE1MDAwMCwgTWF0aC5mbG9vcihvcHRpb25zLmJ1ZGdldE1zICogMTkwKSk7XG4gIGNvbnN0IHNlc3Npb24gPSBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kLCB0YXJnZXRTdGVwcyk7XG4gIGlmIChvcHRpb25zLnN0ZXBzICE9PSB1bmRlZmluZWQpIHJldHVybiBzZXNzaW9uLml0ZXJhdGVTdGVwcyhvcHRpb25zLnN0ZXBzKTtcbiAgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZUZvck1zKG9wdGlvbnMuYnVkZ2V0TXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1wcm92ZWRBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMTUwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgc3RlcHMgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ1RpbWVkKG1vZDogTW9kdWxlLCBidWRnZXRNcyA9IDEwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgYnVkZ2V0TXMgfSk7XG59XG4iLAogICAgIlxuZXhwb3J0IHR5cGUgTnVtVHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiIHwgXCJmMzJcIiB8IFwiZjY0XCJcbmV4cG9ydCB0eXBlIFJlc3VsdFR5cGUgPSBOdW1UeXBlIHwgXCJ2b2lkXCIgfCBTdHJ1Y3RUeXBlPGFueT5cbmV4cG9ydCB0eXBlIEludFR5cGUgPSBcImkzMlwiIHwgXCJpNjRcIlxuZXhwb3J0IHR5cGUgUGFja2VkVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiXG5leHBvcnQgdHlwZSBNZW1vcnlUeXBlID0gTnVtVHlwZSB8IFBhY2tlZFR5cGVcbmV4cG9ydCB0eXBlIERUeXBlID0gTWVtb3J5VHlwZSB8IFN0cnVjdFR5cGU8YW55PlxuZXhwb3J0IHR5cGUgTG9hZGVkVHlwZTxUIGV4dGVuZHMgTWVtb3J5VHlwZT4gPSBUIGV4dGVuZHMgUGFja2VkVHlwZSA/IFwiaTMyXCIgOiBUXG5leHBvcnQgdHlwZSBBcml0aG1ldGljT3AgPSBcImFkZFwiIHwgXCJzdWJcIiB8IFwibXVsXCIgfCBcImRpdlwiXG5leHBvcnQgdHlwZSBCaXRPcCA9IFwieG9yXCIgfCBcInNobFwiIHwgXCJzaHJcIiB8IFwiYW5kXCIgfCBcIm9yXCJcbmV4cG9ydCB0eXBlIFJlbWFpbmRlck9wID0gXCJtb2RcIiB8IFwidW1vZFwiXG5leHBvcnQgdHlwZSBCaW5PcCA9IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3BcbmV4cG9ydCB0eXBlIENtcE9wID0gXCJlcVwiIHwgXCJsdFwiIHwgXCJndFwiXG5jb25zdCBhcml0aG1ldGljT3BzID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdIGFzIGNvbnN0XG5jb25zdCBiaXRPcHMgPSBbXCJhbmRcIiwgXCJvclwiLCBcInhvclwiLCBcInNobFwiLCBcInNoclwiXSBhcyBjb25zdFxuY29uc3QgcmVtYWluZGVyT3BzID0gW1wibW9kXCIsIFwidW1vZFwiXSBhcyBjb25zdFxuY29uc3QgY21wT3BzID0gW1wiZXFcIiwgXCJsdFwiLCBcImd0XCJdIGFzIGNvbnN0XG5leHBvcnQgdHlwZSBWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBUIGV4dGVuZHMgXCJpNjRcIiA/IGJpZ2ludCA6IG51bWJlclxuZXhwb3J0IHR5cGUgVHlwZWRBcnJheUZvcjxUIGV4dGVuZHMgTWVtb3J5VHlwZT4gPVxuICBUIGV4dGVuZHMgXCJpOFwiID8gSW50OEFycmF5IDpcbiAgVCBleHRlbmRzIFwidTE2XCIgPyBVaW50MTZBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImkxNlwiID8gSW50MTZBcnJheSA6XG4gIFQgZXh0ZW5kcyBcInU4XCIgPyBVaW50OEFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTMyXCIgPyBJbnQzMkFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTY0XCIgPyBCaWdJbnQ2NEFycmF5IDpcbiAgVCBleHRlbmRzIFwiZjMyXCIgPyBGbG9hdDMyQXJyYXkgOlxuICBUIGV4dGVuZHMgXCJmNjRcIiA/IEZsb2F0NjRBcnJheSA6IG5ldmVyXG5cbnR5cGUgQXJnc0V4cHI8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8QXJnc1tLXT46IG5ldmVyIH1cbnR5cGUgQXJnc0xpa2U8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHJMaWtlPEFyZ3NbS10+OiBuZXZlciB9XG5leHBvcnQgdHlwZSBBcmdzVmFsPEFyZ3MgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10+ICA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8QXJnc1tLXT4gOiBuZXZlciB9XG5cbnR5cGUgTG9jYWxOb2RlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZTogVCwgbG9jYWw6IG51bWJlciB9XG50eXBlIEdsb2JhbE5vZGU8VCBleHRlbmRzIE51bVR5cGU+ID0geyBraW5kOiBcImdsb2JhbC5nZXRcIiwgdHlwZTogVCwgaW5pdGlhbDogVmFsdWU8VD4gfVxuZXhwb3J0IHR5cGUgQ29yZUV4cHI8VCBleHRlbmRzIE51bVR5cGU+ID1cbiAgfCB7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogVCwgdmFsdWU6IFZhbHVlPFQ+IH1cbiAgfCBMb2NhbE5vZGU8VD5cbiAgfCBHbG9iYWxOb2RlPFQ+XG4gIHwgeyBraW5kOiBcImJpblwiLCB0eXBlOiBULCBvcDogQmluT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwiY2FsbFwiLCB0eXBlOiBULCB0YXJnZXQ6IEFueUZ1bmMsIGFyZ3M6IEV4cHI8TnVtVHlwZT5bXSB9XG4gIHwgeyBraW5kOiBcImNhc3RcIiwgdHlwZTogVCwgaW5wdXRUeXBlOiBOdW1UeXBlLCB1bnNpZ25lZDogYm9vbGVhbiwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJpZlwiLCB0eXBlOiBULCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlOiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwibG9hZFwiLCB0eXBlOiBULCBhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByPFwiaTMyXCI+LCBzdG9yYWdlOiBNZW1vcnlUeXBlLCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxuICB8IChUIGV4dGVuZHMgXCJpMzJcIiA/IHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBOdW1UeXBlLCBvcDogQ21wT3AsIGxlZnQ6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByPE51bVR5cGU+IH0gOiBuZXZlcilcblxuY2xhc3MgRXhwck1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IHt9XG50eXBlIEFyaXRobWV0aWNNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsgW09wIGluIEFyaXRobWV0aWNPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxudHlwZSBDb21wYXJlTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBDbXBPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8XCJpMzJcIj4gfVxudHlwZSBJbnRlZ2VyTWV0aG9kczxUIGV4dGVuZHMgSW50VHlwZT4gPSB7IFtPcCBpbiBCaXRPcCB8IFJlbWFpbmRlck9wXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5leHBvcnQgdHlwZSBFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IENvcmVFeHByPFQ+ICYgRXhwck1ldGhvZHM8VD4gJiBBcml0aG1ldGljTWV0aG9kczxUPiAmIENvbXBhcmVNZXRob2RzPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gSW50ZWdlck1ldGhvZHM8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIEFueUV4cHIgPSBhbnlcblxuXG5leHBvcnQgdHlwZSBTdG10ID1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsOiBudW1iZXIsIHR5cGU6IE51bVR5cGUsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiZ2xvYmFsLnNldFwiLCBnbG9iYWw6IEFueUdsb2JhbCwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheTogQW55QXJyYXksIHR5cGU6IE1lbW9yeVR5cGUsIGluZGV4OiBFeHByPFwiaTMyXCI+LCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiYXJyYXkubW92ZVwiLCBhcnJheTogQW55QXJyYXksIHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPiB9XG4gIHwgeyBraW5kOiBcImlmXCIsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IFN0bXRbXSwgZWxzZTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwiYmxvY2tcIiwgY29udHJvbDogbnVtYmVyLCBib2R5OiBTdG10W10gfVxuICB8IHsga2luZDogXCJsb29wXCIsIGNvbnRyb2w6IG51bWJlciwgY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwiYnJlYWtcIiwgdGFyZ2V0OiBudW1iZXIgfCBudWxsIH1cbiAgfCB7IGtpbmQ6IFwiY29udGludWVcIiwgdGFyZ2V0OiBudW1iZXIgfCBudWxsIH1cbiAgfCB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlPzogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImNhbGwudm9pZFwiLCB0YXJnZXQ6IEFueUZ1bmMsIGFyZ3M6IEV4cHI8TnVtVHlwZT5bXSB9XG4gIHwgeyBraW5kOiBcInRyYXBcIiwgbWVzc2FnZTogc3RyaW5nIH1cbiAgfCB7IGtpbmQ6IFwibG9nXCIsIG1lc3NhZ2U6IHN0cmluZywgdmFsdWU6IEV4cHI8XCJpMzJcIj4gfVxuICB8IHsga2luZDogXCJleHByXCIsIGV4cHI6IEV4cHI8TnVtVHlwZT4gfVxuXG5leHBvcnQgdHlwZSBCbG9ja0hhbmRsZSA9IHsga2luZDogXCJibG9ja1wiLCBpZDogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIExvb3BIYW5kbGUgPSB7IGtpbmQ6IFwibG9vcFwiLCBpZDogbnVtYmVyIH1cbnR5cGUgQ29udHJvbEhhbmRsZSA9IEJsb2NrSGFuZGxlIHwgTG9vcEhhbmRsZVxuXG5jbGFzcyBNdXRhYmxlTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gZXh0ZW5kcyBFeHByTWV0aG9kczxUPiB7XG4gIGRlY2xhcmUgdHlwZTogVFxuICBkZWNsYXJlIHdyaXRlOiAodmFsdWU6IEV4cHI8VD4pID0+IFN0bXRcbiAgc2V0KHZhbHVlOiBFeHByTGlrZTxUPikgeyByZXR1cm4gdGhpcy53cml0ZShsaXQodGhpcy50eXBlLCB2YWx1ZSkpIH1cbn1cbnR5cGUgTXV0YWJsZUFyaXRobWV0aWM8VCBleHRlbmRzIE51bVR5cGU+ID0geyBbT3AgaW4gQXJpdGhtZXRpY09wIGFzIGBpJHtPcH1gXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gU3RtdCB9XG50eXBlIE11dGFibGVJbnRlZ2VyPFQgZXh0ZW5kcyBJbnRUeXBlPiA9IHsgW09wIGluIFwiYW5kXCIgfCBcIm9yXCIgfCBcInhvclwiIGFzIGBpJHtPcH1gXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gU3RtdCB9XG5leHBvcnQgdHlwZSBNdXRhYmxlVmFsdWU8VCBleHRlbmRzIE51bVR5cGU+ID0gRXhwcjxUPiAmIHsgc2V0KHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXQgfSAmIE11dGFibGVBcml0aG1ldGljPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gTXV0YWJsZUludGVnZXI8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIExvY2FsVmFyPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IE11dGFibGVWYWx1ZTxUPiAmIExvY2FsTm9kZTxUPlxuZXhwb3J0IHR5cGUgR2xvYmFsVmFsdWU8VCBleHRlbmRzIE51bVR5cGU+ID0gTXV0YWJsZVZhbHVlPFQ+ICYgR2xvYmFsTm9kZTxUPlxuZXhwb3J0IHR5cGUgQW55R2xvYmFsID0gR2xvYmFsVmFsdWU8TnVtVHlwZT5cblxuZXhwb3J0IHR5cGUgQXJyYXlWYWx1ZTxUIGV4dGVuZHMgRFR5cGU+ID1cbiAgVCBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBNdXRhYmxlU3RydWN0PEY+IDpcbiAgVCBleHRlbmRzIE1lbW9yeVR5cGUgPyBNdXRhYmxlVmFsdWU8TG9hZGVkVHlwZTxUPj4gOiBuZXZlclxuZXhwb3J0IHR5cGUgQXJyYXlIYW5kbGU8VCBleHRlbmRzIERUeXBlPiA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IFRcbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBBcnJheVZhbHVlPFQ+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBCaXRTdG9yYWdlVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiIHwgXCJpMzJcIlxuZXhwb3J0IHR5cGUgQml0RmllbGQgPSByZWFkb25seSBbQml0U3RvcmFnZVR5cGUsIG51bWJlcl1cbmV4cG9ydCB0eXBlIFN0cnVjdFN0b3JhZ2VUeXBlID0gUGFja2VkVHlwZSB8IEludFR5cGVcbmV4cG9ydCB0eXBlIEZpZWxkVHlwZSA9IFN0cnVjdFN0b3JhZ2VUeXBlIHwgQml0RmllbGRcbmV4cG9ydCB0eXBlIFN0cnVjdEZpZWxkcyA9IFJlY29yZDxzdHJpbmcsIEZpZWxkVHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkU3RvcmFnZTxUIGV4dGVuZHMgRmllbGRUeXBlPiA9IFQgZXh0ZW5kcyByZWFkb25seSBbaW5mZXIgUyBleHRlbmRzIEJpdFN0b3JhZ2VUeXBlLCBudW1iZXJdID8gUyA6IEV4dHJhY3Q8VCwgTWVtb3J5VHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkVmFsdWU8VCBleHRlbmRzIEZpZWxkVHlwZT4gPSBMb2FkZWRUeXBlPEZpZWxkU3RvcmFnZTxUPj5cbmV4cG9ydCB0eXBlIEZpZWxkTGF5b3V0ID0geyBzdG9yYWdlOiBTdHJ1Y3RTdG9yYWdlVHlwZSwgYml0T2Zmc2V0OiBudW1iZXIsIGJpdHM6IG51bWJlciB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RUeXBlPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBraW5kOiBcInN0cnVjdFwiXG4gIGZpZWxkczogRlxuICBsYXlvdXQ6IHsgW0sgaW4ga2V5b2YgRl06IEZpZWxkTGF5b3V0IH1cbiAgc2l6ZTogbnVtYmVyXG4gIHN0b3JhZ2U6IFwidThcIiB8IFwidTE2XCIgfCBJbnRUeXBlXG59XG50eXBlIFN0cnVjdE1lbWJlcnM8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7XG4gIFtLIGluIGtleW9mIEZdOiBFeHByPEZpZWxkVmFsdWU8RltLXT4+XG59XG50eXBlIE11dGFibGVTdHJ1Y3RNZW1iZXJzPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBbSyBpbiBrZXlvZiBGXTogTXV0YWJsZVZhbHVlPEZpZWxkVmFsdWU8RltLXT4+XG59XG5leHBvcnQgdHlwZSBTdHJ1Y3RJbml0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0geyBbSyBpbiBrZXlvZiBGXTogRXhwckxpa2U8RmllbGRWYWx1ZTxGW0tdPj4gfVxuZXhwb3J0IHR5cGUgSlNTdHJ1Y3Q8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7IFtLIGluIGtleW9mIEZdOiBWYWx1ZTxGaWVsZFZhbHVlPEZbS10+PiB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RWYWx1ZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IFN0cnVjdE1lbWJlcnM8Rj4gJiB7IHBhY2tlZDogQW55RXhwciB9XG5leHBvcnQgdHlwZSBNdXRhYmxlU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0gU3RydWN0VmFsdWU8Rj4gJiBNdXRhYmxlU3RydWN0TWVtYmVyczxGPiAmIHtcbiAgc2V0KHZhbHVlOiBNdXRhYmxlU3RydWN0PEY+IHwgU3RydWN0SW5pdDxGPik6IFN0bXRcbn1cbmV4cG9ydCB0eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPlxuZXhwb3J0IHR5cGUgU3RtdEJvZHkgPSBTdG10IHwgU3RtdEJvZHlbXVxudHlwZSBDb250cm9sQm9keTxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4gPSBTdG10Qm9keSB8ICgoc2VsZjogSCkgPT4gU3RtdEJvZHkpXG5leHBvcnQgdHlwZSBGdW5jQm9keTxSIGV4dGVuZHMgUmVzdWx0VHlwZT4gPVxuICBSIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8Uj4gfCBTdG10Qm9keSA6XG4gIFIgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gU3RydWN0VmFsdWU8Rj4gfCBTdG10Qm9keSA6XG4gIFN0bXRCb2R5XG5leHBvcnQgdHlwZSBGdW5jSGFuZGxlPEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPiA9IHtcbiAga2luZDogXCJmdW5jXCJcbiAgcGFyYW1zOiBBXG4gIHJlc3VsdDogUlxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj5cbiAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NMaWtlPEE+KSA9PlxuICAgIFIgZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxSPiA6XG4gICAgUiBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBTdHJ1Y3RWYWx1ZTxGPiA6XG4gICAgU3RtdFxufVxuXG5leHBvcnQgdHlwZSBBbnlGdW5jID0ge1xuICBraW5kOiBcImZ1bmNcIlxuICBwYXJhbXM6IHJlYWRvbmx5IE51bVR5cGVbXVxuICByZXN1bHQ6IFJlc3VsdFR5cGVcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBBbnlFeHByW10pID0+IGFueVxuICBjYWxsOiAoLi4uYXJnczogYW55W10pID0+IEFueUV4cHJcbn1cblxuZXhwb3J0IHR5cGUgQW55QXJyYXkgPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICB0eXBlOiBEVHlwZVxuICBsZW5ndGg6IG51bWJlclxuICBlbGVtZW50U2l6ZTogbnVtYmVyXG4gIGF0KC4uLmFyZ3M6IGFueVtdKTogYW55XG4gIG1vdmUoLi4uYXJnczogYW55W10pOiBTdG10XG59XG5cbmV4cG9ydCB0eXBlIE1vZHVsZURlZiA9IFJlY29yZDxzdHJpbmcsIEFueUZ1bmMgfCBBbnlBcnJheSB8IEFueUdsb2JhbD5cbmV4cG9ydCB0eXBlIEZ1bmNEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlGdW5jPiB9XG5leHBvcnQgdHlwZSBBcnJheURlZnM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7IFtLIGluIGtleW9mIFQgYXMgVFtLXSBleHRlbmRzIEFueUFycmF5ID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlBcnJheT4gfVxuZXhwb3J0IHR5cGUgQ29tcGlsZVJlc3VsdDxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHtcbiAgW0sgaW4ga2V5b2YgVF06XG4gICAgVFtLXSBleHRlbmRzIEFueUZ1bmMgPyAoLi4uYXJnczogQXJnc1ZhbDxUW0tdW1wicGFyYW1zXCJdPikgPT5cbiAgICAgIFRbS11bXCJyZXN1bHRcIl0gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8VFtLXVtcInJlc3VsdFwiXT4gOlxuICAgICAgVFtLXVtcInJlc3VsdFwiXSBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBKU1N0cnVjdDxGPiA6XG4gICAgICB2b2lkXG4gICAgOiBUW0tdIGV4dGVuZHMgQXJyYXlIYW5kbGU8aW5mZXIgRD4gP1xuICAgICAgRCBleHRlbmRzIE1lbW9yeVR5cGUgPyBUeXBlZEFycmF5Rm9yPEQ+IDogVWludDhBcnJheSB8IFVpbnQxNkFycmF5IHwgVWludDMyQXJyYXkgfCBCaWdVaW50NjRBcnJheVxuICAgIDogbmV2ZXJcbn0gJiB7XG4gIG1vZDogV2ViQXNzZW1ibHkuTW9kdWxlXG4gIG1lbW9yeTogV2ViQXNzZW1ibHkuTWVtb3J5XG4gIHRyYXBNZXNzYWdlczogc3RyaW5nW11cbiAgbG9nTWVzc2FnZXM6IHN0cmluZ1tdXG4gIHJlc3VsdFN0cnVjdHM6IFJlY29yZDxzdHJpbmcsIFN0cnVjdFR5cGU8YW55Pj5cbn1cblxuXG5sZXQgbmV4dExvY2FsSWQgPSAwXG5sZXQgbmV4dENvbnRyb2xJZCA9IDBcblxuY29uc3QgaW5mZXJUeXBlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwckxpa2U8VD4pID0+XG4gICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgXCJ0eXBlXCIgaW4gdmFsdWUgPyB2YWx1ZS50eXBlIDogXCJpMzJcIikgYXMgVFxuXG5jb25zdCBleHByID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPik6IEV4cHI8VD4gPT4ge1xuICByZXR1cm4gT2JqZWN0LnNldFByb3RvdHlwZU9mKG5vZGUsIEV4cHJNZXRob2RzLnByb3RvdHlwZSkgYXMgRXhwcjxUPlxufVxuXG5leHBvcnQgY29uc3QgbGl0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+IHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChcImtpbmRcIiBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlIGFzIEV4cHI8VD5cbiAgfVxuICByZXR1cm4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZSwgdmFsdWU6IHZhbHVlIGFzIFZhbHVlPFQ+IH0pXG59XG5jb25zdCBtdXRhYmxlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPiwgd3JpdGU6ICh2YWx1ZTogRXhwcjxUPikgPT4gU3RtdCkgPT5cbiAgT2JqZWN0LmFzc2lnbihPYmplY3Quc2V0UHJvdG90eXBlT2Yobm9kZSwgTXV0YWJsZU1ldGhvZHMucHJvdG90eXBlKSwgeyB3cml0ZSB9KSBhcyBNdXRhYmxlVmFsdWU8VD5cblxuY29uc3QgaXNTdG10ID0gKHg6IHVua25vd24pOiB4IGlzIFN0bXQgPT5cbiAgISF4ICYmIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIFwia2luZFwiIGluIHggJiYgKFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiaWZcIiA/IEFycmF5LmlzQXJyYXkoKHggYXMgeyB0aGVuPzogdW5rbm93biB9KS50aGVuKSA6XG4gICAgIVtcImNvbnN0XCIsIFwibG9jYWwuZ2V0XCIsIFwiZ2xvYmFsLmdldFwiLCBcImJpblwiLCBcImNhbGxcIiwgXCJjYXN0XCIsIFwibG9hZFwiLCBcImNtcFwiXS5pbmNsdWRlcygoeCBhcyB7IGtpbmQ6IHN0cmluZyB9KS5raW5kKVxuICApXG5cbmNvbnN0IHN0bXRMaXN0ID0gKGJvZHk6IFN0bXRCb2R5KTogU3RtdFtdID0+IEFycmF5LmlzQXJyYXkoYm9keSkgPyBib2R5LmZsYXRNYXAoc3RtdExpc3QpIDogW2JvZHldXG5leHBvcnQgY29uc3QgYXNTdG10cyA9IDxSIGV4dGVuZHMgUmVzdWx0VHlwZT4oYm9keTogRnVuY0JvZHk8Uj4pID0+IGlzU3RtdChib2R5KSA/IFtib2R5XSA6IEFycmF5LmlzQXJyYXkoYm9keSkgPyBzdG10TGlzdChib2R5KSA6IG51bGxcbmNvbnN0IGJpbmRTdG10cyA9IChib2R5OiBTdG10Qm9keSwgYnI6IG51bWJlciwgbG9vcDogbnVtYmVyIHwgbnVsbCk6IFN0bXRbXSA9PlxuICBzdG10TGlzdChib2R5KS5tYXAocyA9PiBiaW5kU3RtdChzLCBiciwgbG9vcCkpXG5cbmNvbnN0IGJpbmRTdG10ID0gKHM6IFN0bXQsIGJyOiBudW1iZXIsIGxvb3A6IG51bWJlciB8IG51bGwpOiBTdG10ID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwiaWZcIjogcmV0dXJuIHsgLi4ucywgdGhlbjogYmluZFN0bXRzKHMudGhlbiwgYnIsIGxvb3ApLCBlbHNlOiBiaW5kU3RtdHMocy5lbHNlLCBiciwgbG9vcCkgfVxuICAgIGNhc2UgXCJicmVha1wiOiByZXR1cm4geyAuLi5zLCB0YXJnZXQ6IHMudGFyZ2V0ID8/IGJyIH1cbiAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgIGlmIChzLnRhcmdldCAhPSBudWxsKSByZXR1cm4gc1xuICAgICAgaWYgKGxvb3AgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiB7IC4uLnMsIHRhcmdldDogbG9vcCB9XG4gICAgZGVmYXVsdDogcmV0dXJuIHNcbiAgfVxufVxuXG5jb25zdCBjb250cm9sQm9keSA9IDxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4oc2VsZjogSCwgYm9keTogQ29udHJvbEJvZHk8SD4pID0+XG4gIGJpbmRTdG10cyh0eXBlb2YgYm9keSA9PT0gXCJmdW5jdGlvblwiID8gYm9keShzZWxmKSA6IGJvZHksIHNlbGYuaWQsIHNlbGYua2luZCA9PT0gXCJsb29wXCIgPyBzZWxmLmlkIDogbnVsbClcblxuY29uc3QgYmluID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQXJpdGhtZXRpY09wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG5cbmNvbnN0IGJpdCA9IDxUIGV4dGVuZHMgSW50VHlwZT4ob3A6IEJpdE9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG5cbmNvbnN0IHJlbWFpbmRlciA9IDxUIGV4dGVuZHMgSW50VHlwZT4ob3A6IFJlbWFpbmRlck9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG5cbmNvbnN0IGNtcCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4ob3A6IENtcE9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+ID0+XG4gIGV4cHI8XCJpMzJcIj4oeyBraW5kOiBcImNtcFwiLCB0eXBlOiBcImkzMlwiLCBpbnB1dFR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQ6IGxlZnQgYXMgdW5rbm93biBhcyBFeHByPE51bVR5cGU+LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPE51bVR5cGU+IH0gYXMgQ29yZUV4cHI8XCJpMzJcIj4pXG5cbmV4cG9ydCBjb25zdCBhbGxvY2F0ZUxvY2FsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKSA9PiBleHByKHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZSwgbG9jYWw6IG5leHRMb2NhbElkKysgfSlcblxuY29uc3QgbWtMb2NhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCk6IExvY2FsVmFyPFQ+ID0+IHtcbiAgY29uc3QgbG9jYWwgPSBuZXh0TG9jYWxJZCsrXG4gIHJldHVybiBtdXRhYmxlKHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZSwgbG9jYWwgfSwgdmFsdWUgPT4gKHsga2luZDogXCJsb2NhbC5zZXRcIiwgbG9jYWwsIHR5cGUsIHZhbHVlOiB2YWx1ZSBhcyBFeHByPE51bVR5cGU+IH0pKSBhcyBMb2NhbFZhcjxUPlxufVxuXG5jb25zdCBta0hhbmRsZSA9IDxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4oXG4gIHBhcmFtczogQSxcbiAgcmVzdWx0OiBSLFxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj4sXG4pOiBGdW5jSGFuZGxlPEEsIFI+ID0+IHtcbiAgbGV0IGhhbmRsZSE6IEZ1bmNIYW5kbGU8QSwgUj5cbiAgaGFuZGxlID0ge1xuICAgIGtpbmQ6IFwiZnVuY1wiLFxuICAgIHBhcmFtcywgcmVzdWx0LCBidWlsZCxcbiAgICBjYWxsOiAoLi4uYXJnczogQXJnc0xpa2U8QT4pID0+IHtcbiAgICAgIGNvbnN0IGNhbGxBcmdzID0gcGFyYW1zLm1hcCgodHlwZSwgaSkgPT4gbGl0KHR5cGUsIGFyZ3NbaV0gYXMgRXhwckxpa2U8dHlwZW9mIHR5cGU+KSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gICAgICBpZiAocmVzdWx0ID09PSBcInZvaWRcIikgcmV0dXJuIHsga2luZDogXCJjYWxsLnZvaWRcIiwgdGFyZ2V0OiBoYW5kbGUsIGFyZ3M6IGNhbGxBcmdzIH1cbiAgICAgIGNvbnN0IHR5cGUgPSAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIiA/IHJlc3VsdCA6IHJlc3VsdC5zdG9yYWdlID09PSBcImk2NFwiID8gXCJpNjRcIiA6IFwiaTMyXCIpIGFzIE51bVR5cGVcbiAgICAgIGNvbnN0IGNhbGwgPSBleHByKHsga2luZDogXCJjYWxsXCIsIHR5cGUsIHRhcmdldDogaGFuZGxlLCBhcmdzOiBjYWxsQXJncyB9KVxuICAgICAgcmV0dXJuIHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIgPyBjYWxsIDogcmVhZFN0cnVjdChyZXN1bHQsIGNhbGwpXG4gICAgfSxcbiAgfSBhcyBGdW5jSGFuZGxlPEEsIFI+XG4gIHJldHVybiBoYW5kbGVcbn1cblxuY29uc3QgbG9hZGVkVHlwZSA9IDxUIGV4dGVuZHMgTWVtb3J5VHlwZT4odHlwZTogVCkgPT5cbiAgKHR5cGUgPT09IFwiaThcIiB8fCB0eXBlID09PSBcInU4XCIgfHwgdHlwZSA9PT0gXCJpMTZcIiB8fCB0eXBlID09PSBcInUxNlwiID8gXCJpMzJcIiA6IHR5cGUpIGFzIExvYWRlZFR5cGU8VD5cblxuY29uc3Qgc3RvcmFnZVNpemU6IFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+ID0geyBpODogMSwgdTg6IDEsIGkxNjogMiwgdTE2OiAyLCBpMzI6IDQsIGYzMjogNCwgaTY0OiA4LCBmNjQ6IDggfVxuY29uc3QgbWVtb3J5VmFsdWUgPSA8VCBleHRlbmRzIE1lbW9yeVR5cGU+KGFycmF5OiBBbnlBcnJheSwgaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+LCBzdG9yYWdlOiBULCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0ID0gMCkgPT4ge1xuICBjb25zdCBhdCA9IGxpdChcImkzMlwiLCBpbmRleClcbiAgcmV0dXJuIG11dGFibGUoeyBraW5kOiBcImxvYWRcIiwgdHlwZTogbG9hZGVkVHlwZShzdG9yYWdlKSwgYXJyYXksIGluZGV4OiBhdCwgc3RvcmFnZSwgc3RyaWRlLCBvZmZzZXQgfSwgdmFsdWUgPT5cbiAgICAoeyBraW5kOiBcImFycmF5LnN0b3JlXCIsIGFycmF5LCB0eXBlOiBzdG9yYWdlLCBpbmRleDogYXQsIHN0cmlkZSwgb2Zmc2V0LCB2YWx1ZTogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KSlcbn1cblxudHlwZSBTdHJ1Y3RCYWNraW5nID0gYW55XG50eXBlIEludGVybmFsU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0gTXV0YWJsZVN0cnVjdDxGPiAmIHsgcGFja2VkOiBTdHJ1Y3RCYWNraW5nIH1cblxuY29uc3QgcmVhZEZpZWxkID0gKGJhY2tpbmc6IEFueUV4cHIsIGZpZWxkOiBGaWVsZExheW91dCkgPT4ge1xuICBjb25zdCB7IGJpdHMgfSA9IGZpZWxkXG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImk2NFwiKSByZXR1cm4gYmFja2luZ1xuICBpZiAoYmFja2luZy50eXBlID09PSBcImk2NFwiKSB7XG4gICAgY29uc3QgYml0T2Zmc2V0ID0gQmlnSW50KGZpZWxkLmJpdE9mZnNldCksIG1hc2sgPSAoMW4gPDwgQmlnSW50KGJpdHMpKSAtIDFuXG4gICAgY29uc3QgcmF3ID0gaTMyKGJhY2tpbmcuc2hyKGJpdE9mZnNldCkuYW5kKG1hc2spKVxuICAgIHJldHVybiBmaWVsZC5zdG9yYWdlLnN0YXJ0c1dpdGgoXCJpXCIpICYmIGJpdHMgPCAzMlxuICAgICAgPyBpZkVsc2UocmF3LmFuZCgyICoqIChiaXRzIC0gMSkpLCByYXcuc3ViKDIgKiogYml0cyksIHJhdylcbiAgICAgIDogcmF3XG4gIH1cbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTMyXCIgJiYgZmllbGQuYml0T2Zmc2V0ID09PSAwKSByZXR1cm4gYmFja2luZ1xuICBjb25zdCBtYXNrID0gMiAqKiBiaXRzIC0gMVxuICBjb25zdCByYXcgPSBiYWNraW5nLnNocihmaWVsZC5iaXRPZmZzZXQpLmFuZChtYXNrKVxuICByZXR1cm4gZmllbGQuc3RvcmFnZS5zdGFydHNXaXRoKFwiaVwiKSAmJiBiaXRzIDwgMzJcbiAgICA/IGlmRWxzZShyYXcuYW5kKDIgKiogKGJpdHMgLSAxKSksIHJhdy5zdWIoMiAqKiBiaXRzKSwgcmF3KVxuICAgIDogcmF3XG59XG5cbmNvbnN0IHBhY2tlZEZpZWxkVmFsdWUgPSAoYmFja2luZzogU3RydWN0QmFja2luZywgZmllbGQ6IEZpZWxkTGF5b3V0KSA9PiB7XG4gIGNvbnN0IHZhbHVlID0gcmVhZEZpZWxkKGJhY2tpbmcsIGZpZWxkKVxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIikgcmV0dXJuIGJhY2tpbmdcbiAgaWYgKGJhY2tpbmcudHlwZSA9PT0gXCJpNjRcIikge1xuICAgIGNvbnN0IGJpdE9mZnNldCA9IEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpLCBtYXNrID0gKDFuIDw8IEJpZ0ludChmaWVsZC5iaXRzKSkgLSAxblxuICAgIGNvbnN0IGZpZWxkTWFzayA9IG1hc2sgPDwgYml0T2Zmc2V0XG4gICAgcmV0dXJuIG11dGFibGU8XCJpMzJcIj4odmFsdWUgYXMgRXhwcjxcImkzMlwiPiwgaW5wdXQgPT4gYmFja2luZy5zZXQoYmFja2luZy5hbmQofmZpZWxkTWFzaykub3IoaTY0dShpbnB1dCkuYW5kKG1hc2spLnNobChiaXRPZmZzZXQpKSkpXG4gIH1cbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTMyXCIgJiYgZmllbGQuYml0T2Zmc2V0ID09PSAwKSByZXR1cm4gYmFja2luZ1xuICBjb25zdCBtYXNrID0gMiAqKiBmaWVsZC5iaXRzIC0gMSwgZmllbGRNYXNrID0gbWFzayA8PCBmaWVsZC5iaXRPZmZzZXRcbiAgcmV0dXJuIG11dGFibGU8XCJpMzJcIj4odmFsdWUsIGlucHV0ID0+IGJhY2tpbmcuc2V0KGJhY2tpbmcuYW5kKH5maWVsZE1hc2spLm9yKGlucHV0LmFuZChtYXNrKS5zaGwoZmllbGQuYml0T2Zmc2V0KSkpKVxufVxuXG5jb25zdCByZWFkU3RydWN0ID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHBhY2tlZDogQW55RXhwcik6IFN0cnVjdFZhbHVlPEY+ID0+XG4gIE9iamVjdC5hc3NpZ24oT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5tYXAobmFtZSA9PiBbbmFtZSwgcmVhZEZpZWxkKHBhY2tlZCwgdHlwZS5sYXlvdXRbbmFtZV0hKV0pKSwgeyBwYWNrZWQgfSkgYXMgU3RydWN0VmFsdWU8Rj5cblxuY29uc3Qgc3RydWN0VmFsdWUgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgcGFja2VkOiBTdHJ1Y3RCYWNraW5nKTogTXV0YWJsZVN0cnVjdDxGPiA9PiB7XG4gIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykubWFwKG5hbWUgPT4gW25hbWUsIHBhY2tlZEZpZWxkVmFsdWUocGFja2VkLCB0eXBlLmxheW91dFtuYW1lXSEpXSkpXG4gIHJldHVybiBPYmplY3QuYXNzaWduKGZpZWxkcywgeyBwYWNrZWQsIHNldDogKHZhbHVlOiBNdXRhYmxlU3RydWN0PEY+IHwgU3RydWN0SW5pdDxGPikgPT5cbiAgICBwYWNrZWQuc2V0KFwicGFja2VkXCIgaW4gdmFsdWUgPyAodmFsdWUgYXMgSW50ZXJuYWxTdHJ1Y3Q8Rj4pLnBhY2tlZCA6IHBhY2tTdHJ1Y3QodHlwZSwgdmFsdWUpKSB9KSBhcyBJbnRlcm5hbFN0cnVjdDxGPlxufVxuXG5jb25zdCBwYWNrU3RydWN0ID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHZhbHVlczogU3RydWN0SW5pdDxGPik6IEFueUV4cHIgPT4ge1xuICBpZiAodHlwZS5zdG9yYWdlICE9PSBcImk2NFwiKSByZXR1cm4gT2JqZWN0LmtleXModHlwZS5maWVsZHMpLnJlZHVjZSgocGFja2VkLCBuYW1lKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSB0eXBlLmxheW91dFtuYW1lXSEsIHZhbHVlID0gdmFsdWVzW25hbWVdIVxuICAgIGNvbnN0IG1hc2sgPSAyICoqIGZpZWxkLmJpdHMgLSAxXG4gICAgcmV0dXJuIHBhY2tlZC5vcihsaXQoXCJpMzJcIiwgdmFsdWUgYXMgRXhwckxpa2U8XCJpMzJcIj4pLmFuZChtYXNrKS5zaGwoZmllbGQuYml0T2Zmc2V0KSlcbiAgfSwgaTMyKDApKVxuICByZXR1cm4gT2JqZWN0LmtleXModHlwZS5maWVsZHMpLnJlZHVjZSgocGFja2VkLCBuYW1lKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSB0eXBlLmxheW91dFtuYW1lXSEsIHZhbHVlID0gdmFsdWVzW25hbWVdIVxuICAgIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImk2NFwiKSByZXR1cm4gbGl0KFwiaTY0XCIsIHZhbHVlIGFzIEV4cHJMaWtlPFwiaTY0XCI+KVxuICAgIGNvbnN0IG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgcmV0dXJuIHBhY2tlZC5vcihpNjR1KGxpdChcImkzMlwiLCB2YWx1ZSBhcyBFeHByTGlrZTxcImkzMlwiPikpLmFuZChtYXNrKS5zaGwoQmlnSW50KGZpZWxkLmJpdE9mZnNldCkpKVxuICB9LCBpNjQoMG4pKVxufVxuXG5leHBvcnQgY29uc3Qgc3RydWN0ID0gPGNvbnN0IEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KGZpZWxkczogRik6IFN0cnVjdFR5cGU8Rj4gPT4ge1xuICBpZiAoXCJzZXRcIiBpbiBmaWVsZHMgfHwgXCJwYWNrZWRcIiBpbiBmaWVsZHMpIHRocm93IG5ldyBFcnJvcihcIlN0cnVjdCBmaWVsZHMgY2Fubm90IGJlIG5hbWVkIHNldCBvciBwYWNrZWRcIilcbiAgbGV0IHVzZWQgPSAwXG4gIGNvbnN0IGxheW91dDogUGFydGlhbDxSZWNvcmQ8a2V5b2YgRiwgRmllbGRMYXlvdXQ+PiA9IHt9XG4gIGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyhmaWVsZHMpIGFzIChrZXlvZiBGKVtdKSB7XG4gICAgY29uc3QgZmllbGQgPSBmaWVsZHNbbmFtZV0hXG4gICAgY29uc3Qgc3RvcmFnZSA9IChBcnJheS5pc0FycmF5KGZpZWxkKSA/IGZpZWxkWzBdIDogZmllbGQpIGFzIFN0cnVjdFN0b3JhZ2VUeXBlXG4gICAgY29uc3QgYml0cyA9IEFycmF5LmlzQXJyYXkoZmllbGQpID8gZmllbGRbMV0gOiBzdG9yYWdlU2l6ZVtzdG9yYWdlXSAqIDhcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoYml0cykgfHwgYml0cyA8IDEgfHwgYml0cyA+IHN0b3JhZ2VTaXplW3N0b3JhZ2VdICogOCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkICR7c3RvcmFnZX0gYml0LWZpZWxkIHdpZHRoICR7Yml0c31gKVxuICAgIGlmICh1c2VkICsgYml0cyA+IDY0KSB0aHJvdyBuZXcgRXJyb3IoYFN0cnVjdCByZXF1aXJlcyAke3VzZWQgKyBiaXRzfSBiaXRzOyBtYXhpbXVtIGlzIDY0YClcbiAgICBsYXlvdXRbbmFtZV0gPSB7IHN0b3JhZ2UsIGJpdE9mZnNldDogdXNlZCwgYml0cyB9XG4gICAgdXNlZCArPSBiaXRzXG4gIH1cbiAgY29uc3Qgc3RvcmFnZSA9IHVzZWQgPD0gOCA/IFwidThcIiA6IHVzZWQgPD0gMTYgPyBcInUxNlwiIDogdXNlZCA8PSAzMiA/IFwiaTMyXCIgOiBcImk2NFwiXG4gIHJldHVybiB7IGtpbmQ6IFwic3RydWN0XCIsIGZpZWxkcywgbGF5b3V0OiBsYXlvdXQgYXMgeyBbSyBpbiBrZXlvZiBGXTogRmllbGRMYXlvdXQgfSwgc3RvcmFnZSwgc2l6ZTogc3RvcmFnZVNpemVbc3RvcmFnZV0gfVxufVxuXG5jb25zdCBjYXN0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogRXhwcjxOdW1UeXBlPiwgdW5zaWduZWQgPSBmYWxzZSk6IEV4cHI8VD4gPT5cbiAgdmFsdWUudHlwZSA9PT0gdHlwZSA/IHZhbHVlIGFzIHVua25vd24gYXMgRXhwcjxUPiA6IGV4cHI8VD4oeyBraW5kOiBcImNhc3RcIiwgdHlwZSwgaW5wdXRUeXBlOiB2YWx1ZS50eXBlLCB1bnNpZ25lZCwgdmFsdWUgfSBhcyBDb3JlRXhwcjxUPilcbmNvbnN0IG51bWJlciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IHVua25vd24pOiBFeHByPFQ+ID0+XG4gIHR5cGVvZiB2YWx1ZSA9PT0gKHR5cGUgPT09IFwiaTY0XCIgPyBcImJpZ2ludFwiIDogXCJudW1iZXJcIilcbiAgICA/IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGUsIHZhbHVlIH0gYXMgQ29yZUV4cHI8VD4pXG4gICAgOiBjYXN0KHR5cGUsIHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4pXG5cbmV4cG9ydCBmdW5jdGlvbiBpMzIodmFsdWU6IG51bWJlcik6IEV4cHI8XCJpMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBpMzI8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImkzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGkzMih2YWx1ZTogdW5rbm93bikgeyByZXR1cm4gbnVtYmVyKFwiaTMyXCIsIHZhbHVlKSB9XG5cbmV4cG9ydCBmdW5jdGlvbiBpNjQodmFsdWU6IGJpZ2ludCk6IEV4cHI8XCJpNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBpNjQ8VCBleHRlbmRzIEludFR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImk2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGk2NCh2YWx1ZTogdW5rbm93bikgeyByZXR1cm4gbnVtYmVyKFwiaTY0XCIsIHZhbHVlKSB9XG5leHBvcnQgY29uc3QgaTY0dSA9ICh2YWx1ZTogRXhwcjxcImkzMlwiPikgPT4gY2FzdChcImk2NFwiLCB2YWx1ZSBhcyB1bmtub3duIGFzIEV4cHI8TnVtVHlwZT4sIHRydWUpXG5cbnR5cGUgRjMySW5wdXQgPSBudW1iZXIgfCBFeHByPFwiaTMyXCIgfCBcImk2NFwiIHwgXCJmMzJcIiB8IFwiZjY0XCI+XG5leHBvcnQgZnVuY3Rpb24gZjMyKHZhbHVlOiBudW1iZXIpOiBFeHByPFwiZjMyXCI+XG5leHBvcnQgZnVuY3Rpb24gZjMyPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJmMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBmMzIodmFsdWU6IEYzMklucHV0KSB7IHJldHVybiBudW1iZXIoXCJmMzJcIiwgdmFsdWUpIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGY2NCh2YWx1ZTogbnVtYmVyKTogRXhwcjxcImY2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGY2NDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiZjY0XCI+XG5leHBvcnQgZnVuY3Rpb24gZjY0KHZhbHVlOiBGMzJJbnB1dCkgeyByZXR1cm4gbnVtYmVyKFwiZjY0XCIsIHZhbHVlKSB9XG5cbmV4cG9ydCBmdW5jdGlvbiBpZkVsc2U8VCBleHRlbmRzIE51bVR5cGU+KGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2VfOiBFeHByPFQ+KTogRXhwcjxUPlxuZXhwb3J0IGZ1bmN0aW9uIGlmRWxzZShjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10Qm9keSwgZWxzZV8/OiBTdG10Qm9keSk6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiBpZkVsc2U8VCBleHRlbmRzIE51bVR5cGU+KGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4gfCBTdG10Qm9keSwgZWxzZV8/OiBFeHByPFQ+IHwgU3RtdEJvZHkpOiBFeHByPFQ+IHwgU3RtdCB7XG4gIHJldHVybiBpc1N0bXQodGhlbikgfHwgQXJyYXkuaXNBcnJheSh0aGVuKVxuICAgID8geyBraW5kOiBcImlmXCIsIGNvbmQsIHRoZW46IHN0bXRMaXN0KHRoZW4gYXMgU3RtdEJvZHkpLCBlbHNlOiBlbHNlXyA9PT0gdW5kZWZpbmVkID8gW10gOiBzdG10TGlzdChlbHNlXyBhcyBTdG10Qm9keSkgfVxuICAgIDogZXhwcjxUPih7IGtpbmQ6IFwiaWZcIiwgdHlwZTogdGhlbi50eXBlLCBjb25kLCB0aGVuLCBlbHNlOiBlbHNlXyBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG59XG5cbmNvbnN0IGFyaXRobWV0aWMgPSBPYmplY3QuZnJvbUVudHJpZXMoYXJpdGhtZXRpY09wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gQXJpdGhtZXRpY09wXTogPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuY29uc3QgYml0cyA9IE9iamVjdC5mcm9tRW50cmllcyhiaXRPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpdChvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIEJpdE9wXTogPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuY29uc3QgcmVtYWluZGVycyA9IE9iamVjdC5mcm9tRW50cmllcyhyZW1haW5kZXJPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IHJlbWFpbmRlcihvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIFJlbWFpbmRlck9wXTogPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuY29uc3QgY29tcGFyaXNvbnMgPSBPYmplY3QuZnJvbUVudHJpZXMoY21wT3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBDbXBPcF06IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFwiaTMyXCI+IH1cblxuZm9yIChjb25zdCBvcCBvZiBhcml0aG1ldGljT3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwckxpa2U8TnVtVHlwZT4pIHsgcmV0dXJuIGFyaXRobWV0aWNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgYml0T3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPEludFR5cGU+LCByaWdodDogRXhwckxpa2U8SW50VHlwZT4pIHsgcmV0dXJuIGJpdHNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgcmVtYWluZGVyT3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPEludFR5cGU+LCByaWdodDogRXhwckxpa2U8SW50VHlwZT4pIHsgcmV0dXJuIHJlbWFpbmRlcnNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgY21wT3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwckxpa2U8TnVtVHlwZT4pIHsgcmV0dXJuIGNvbXBhcmlzb25zW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIFsuLi5hcml0aG1ldGljT3BzLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCJdIGFzIGNvbnN0KSBPYmplY3QuZGVmaW5lUHJvcGVydHkoTXV0YWJsZU1ldGhvZHMucHJvdG90eXBlLCBgaSR7b3B9YCwge1xuICB2YWx1ZSh0aGlzOiBNdXRhYmxlVmFsdWU8YW55PiwgcmlnaHQ6IGFueSkgeyByZXR1cm4gdGhpcy5zZXQoKHRoaXMgYXMgYW55KVtvcF0ocmlnaHQpKSB9LFxufSlcblxuZXhwb3J0IGNvbnN0IHsgYWRkLCBzdWIsIG11bCwgZGl2IH0gPSBhcml0aG1ldGljXG5leHBvcnQgY29uc3QgeyBhbmQsIG9yLCB4b3IsIHNobCwgc2hyIH0gPSBiaXRzXG5leHBvcnQgY29uc3QgeyBtb2QsIHVtb2QgfSA9IHJlbWFpbmRlcnNcbmV4cG9ydCBjb25zdCB7IGVxLCBsdCwgZ3QgfSA9IGNvbXBhcmlzb25zXG5cbmV4cG9ydCBjb25zdCBmdW5jID0gPGNvbnN0IEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPihwYXJhbXM6IEEsIHJlc3VsdDogUiwgYnVpbGQ6ICguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4gRnVuY0JvZHk8Uj4pID0+XG4gIG1rSGFuZGxlKHBhcmFtcywgcmVzdWx0LCBidWlsZCBhcyAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPilcbmV4cG9ydCBmdW5jdGlvbiBhcnJheTxUIGV4dGVuZHMgRFR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobGVuZ3RoKSB8fCBsZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFycmF5IGxlbmd0aCAke2xlbmd0aH1gKVxuICBjb25zdCBzdHJ1Y3QgPSB0eXBlb2YgdHlwZSA9PT0gXCJvYmplY3RcIiA/IHR5cGUgOiBudWxsXG4gIGNvbnN0IHN0b3JhZ2U6IE1lbW9yeVR5cGUgPSBzdHJ1Y3QgPyBzdHJ1Y3Quc3RvcmFnZSA6IHR5cGUgYXMgTWVtb3J5VHlwZVxuICBjb25zdCBlbGVtZW50U2l6ZSA9IHN0cnVjdCA/IHN0cnVjdC5zaXplIDogc3RvcmFnZVNpemVbc3RvcmFnZV1cbiAgbGV0IGhhbmRsZTogQW55QXJyYXlcbiAgaGFuZGxlID0ge1xuICAgIGtpbmQ6IFwiYXJyYXlcIiwgdHlwZSwgbGVuZ3RoLCBlbGVtZW50U2l6ZSxcbiAgICBhdDogaW5kZXggPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBtZW1vcnlWYWx1ZShoYW5kbGUsIGluZGV4LCBzdG9yYWdlLCBlbGVtZW50U2l6ZSlcbiAgICAgIHJldHVybiBzdHJ1Y3QgPyBzdHJ1Y3RWYWx1ZShzdHJ1Y3QsIHZhbHVlKSA6IHZhbHVlXG4gICAgfSxcbiAgICBtb3ZlOiAodGFyZ2V0LCBzb3VyY2UsIGNvdW50KSA9PiAoeyBraW5kOiBcImFycmF5Lm1vdmVcIiwgYXJyYXk6IGhhbmRsZSwgdGFyZ2V0OiBsaXQoXCJpMzJcIiwgdGFyZ2V0KSwgc291cmNlOiBsaXQoXCJpMzJcIiwgc291cmNlKSwgY291bnQ6IGxpdChcImkzMlwiLCBjb3VudCkgfSksXG4gIH1cbiAgcmV0dXJuIGhhbmRsZSBhcyBBcnJheUhhbmRsZTxUPlxufVxuXG5jb25zdCBta1N0cnVjdExvY2FsID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4pID0+XG4gIHN0cnVjdFZhbHVlKHR5cGUsIG1rTG9jYWwodHlwZS5zdG9yYWdlID09PSBcImk2NFwiID8gXCJpNjRcIiA6IFwiaTMyXCIpKVxuXG50eXBlIExvY2FsRmFjdG9yeSA9IHtcbiAgPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKTogTG9jYWxWYXI8VD5cbiAgPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4pOiBNdXRhYmxlU3RydWN0PEY+XG59XG5cbmV4cG9ydCBjb25zdCBsb2NhbCA9ICg8VCBleHRlbmRzIE51bVR5cGUsIEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFQgfCBTdHJ1Y3RUeXBlPEY+KSA9PlxuICB0eXBlb2YgdHlwZSA9PT0gXCJzdHJpbmdcIiA/IG1rTG9jYWwodHlwZSkgOiBta1N0cnVjdExvY2FsKHR5cGUpKSBhcyBMb2NhbEZhY3RvcnlcblxuY29uc3QgZXhwSW1wbCA9IGZ1bmMoW1wiZjMyXCJdLCBcImYzMlwiLCB4ID0+IHtcbiAgY29uc3QgeSA9IGxvY2FsKFwiZjMyXCIpXG4gIHJldHVybiBbXG4gICAgeS5zZXQoaWZFbHNlKHgubHQoLTE2KSwgZjMyKC0xNiksIGlmRWxzZSh4Lmd0KDE2KSwgZjMyKDE2KSwgeCkpLmRpdigyMDQ4KS5hZGQoMSkpLFxuICAgIC4uLkFycmF5LmZyb20oeyBsZW5ndGg6IDExIH0sICgpID0+IHkuaW11bCh5KSksXG4gICAgcmV0KHkpLFxuICBdXG59KVxuZXhwb3J0IGNvbnN0IGV4cCA9ICh2YWx1ZTogRXhwckxpa2U8XCJmMzJcIj4pID0+IGV4cEltcGwuY2FsbCh2YWx1ZSlcblxuZXhwb3J0IGNvbnN0IGdsb2JhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgaW5pdGlhbDogVmFsdWU8VD4pOiBHbG9iYWxWYWx1ZTxUPiA9PiB7XG4gIGxldCB2YWx1ZSE6IEdsb2JhbFZhbHVlPFQ+XG4gIHZhbHVlID0gbXV0YWJsZSh7IGtpbmQ6IFwiZ2xvYmFsLmdldFwiLCB0eXBlLCBpbml0aWFsIH0sIGlucHV0ID0+XG4gICAgKHsga2luZDogXCJnbG9iYWwuc2V0XCIsIGdsb2JhbDogdmFsdWUgYXMgdW5rbm93biBhcyBBbnlHbG9iYWwsIHZhbHVlOiBpbnB1dCBhcyBFeHByPE51bVR5cGU+IH0pKSBhcyBHbG9iYWxWYWx1ZTxUPlxuICByZXR1cm4gdmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJldCgpOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0KHZhbHVlOiB7IHBhY2tlZDogQW55RXhwciB9KTogU3RtdFxuZXhwb3J0IGZ1bmN0aW9uIHJldDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU/OiBFeHByTGlrZTxUPiB8IHsgcGFja2VkOiBBbnlFeHByIH0pOiBTdG10IHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIFwicGFja2VkXCIgaW4gdmFsdWUpIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlOiB2YWx1ZS5wYWNrZWQgfVxuICByZXR1cm4geyBraW5kOiBcInJldHVyblwiLCB2YWx1ZTogbGl0KGluZmVyVHlwZSh2YWx1ZSksIHZhbHVlKSBhcyBFeHByPE51bVR5cGU+IH1cbn1cbmV4cG9ydCBjb25zdCB0cmFwID0gKG1lc3NhZ2U6IHN0cmluZyk6IFN0bXQgPT4gKHsga2luZDogXCJ0cmFwXCIsIG1lc3NhZ2UgfSlcbmV4cG9ydCBjb25zdCBib3VuZHNDaGVjayA9IChhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+ID0gMSk6IFN0bXQgPT4ge1xuICBjb25zdCBpID0gbGl0KFwiaTMyXCIsIGluZGV4KSwgbiA9IGxpdChcImkzMlwiLCBjb3VudClcbiAgcmV0dXJuIGlmRWxzZShpLmx0KDApLm9yKG4ubHQoMCkpLm9yKG4uZ3QoYXJyYXkubGVuZ3RoKSkub3IoaS5ndChpMzIoYXJyYXkubGVuZ3RoKS5zdWIobikpKSwgdHJhcChcImFycmF5IGJvdW5kcyBleGNlZWRlZFwiKSlcbn1cbmV4cG9ydCBjb25zdCBsb2cgPSAobWVzc2FnZTogc3RyaW5nLCB2YWx1ZTogRXhwckxpa2U8XCJpMzJcIj4pOiBTdG10ID0+ICh7IGtpbmQ6IFwibG9nXCIsIG1lc3NhZ2UsIHZhbHVlOiBsaXQoXCJpMzJcIiwgdmFsdWUpIH0pXG5leHBvcnQgY29uc3QgYmxvY2sgPSAoYm9keTogQ29udHJvbEJvZHk8QmxvY2tIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImJsb2NrXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cbmV4cG9ydCBjb25zdCBsb29wID0gKGNvbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IENvbnRyb2xCb2R5PExvb3BIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IExvb3BIYW5kbGUgPSB7IGtpbmQ6IFwibG9vcFwiLCBpZDogbmV4dENvbnRyb2xJZCsrIH1cbiAgcmV0dXJuIHsga2luZDogXCJsb29wXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGNvbmQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cblxuZXhwb3J0IGNvbnN0IGJyZWFrVG8gPSAodGFyZ2V0PzogQ29udHJvbEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGNvbnRpbnVlVG8gPSAodGFyZ2V0PzogTG9vcEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGV4cHJTdG10ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IFN0bXQgPT4gKHsga2luZDogXCJleHByXCIsIGV4cHI6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSlcbiIsCiAgICAiaW1wb3J0IHtcbiAgYWxsb2NhdGVMb2NhbCwgYXNTdG10cyxcbiAgdHlwZSBBbnlBcnJheSwgdHlwZSBBbnlGdW5jLCB0eXBlIEFueUdsb2JhbCwgdHlwZSBBcnJheURlZnMsIHR5cGUgRXhwcixcbiAgdHlwZSBGdW5jQm9keSwgdHlwZSBGdW5jRGVmcywgdHlwZSBNb2R1bGVEZWYsIHR5cGUgTnVtVHlwZSwgdHlwZSBSZXN1bHRUeXBlLFxufSBmcm9tIFwiLi9hc3RcIlxuXG5jb25zdCBkaWUgPSAoeDogdW5rbm93bik6IG5ldmVyID0+IHsgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHZhbHVlOiAke1N0cmluZyh4KX1gKSB9XG5leHBvcnQgdHlwZSBBcnJheUxheW91dCA9IHsgbGVuZ3RoOiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCBlbGVtZW50U2l6ZTogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIE1vZHVsZUFuYWx5c2lzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0ge1xuICBmdW5jczogRnVuY0RlZnM8VD5cbiAgYXJyYXlzOiBBcnJheURlZnM8VD5cbiAgZkVudHJpZXM6IFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGJ1aWx0RnVuY3M6IEJ1aWx0RnVuY1tdXG4gIGZpeDogTWFwPEFueUZ1bmMsIG51bWJlcj5cbiAgbGF5b3V0czogTWFwPEFueUFycmF5LCBBcnJheUxheW91dD5cbiAgZ2xvYmFsczogTWFwPEFueUdsb2JhbCwgbnVtYmVyPlxuICB0cmFwTWVzc2FnZXM6IHN0cmluZ1tdXG4gIGxvZ01lc3NhZ2VzOiBzdHJpbmdbXVxuICBwYWdlczogbnVtYmVyXG59XG5cbnR5cGUgVmlzaXRvcnMgPSB7XG4gIGxvY2FsPzogKGlkOiBudW1iZXIsIHR5cGU6IE51bVR5cGUpID0+IHZvaWRcbiAgYXJyYXk/OiAoYXJyYXk6IEFueUFycmF5KSA9PiB2b2lkXG4gIGZ1bmM/OiAoZnVuYzogQW55RnVuYykgPT4gdm9pZFxuICBnbG9iYWw/OiAoZ2xvYmFsOiBBbnlHbG9iYWwpID0+IHZvaWRcbiAgdHJhcD86IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbiAgbG9nPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxufVxuY29uc3Qgd2FsayA9IChub2RlOiBhbnksIGZuczogVmlzaXRvcnMpOiB2b2lkID0+IHtcbiAgaWYgKG5vZGUgPT0gbnVsbCkgcmV0dXJuXG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSByZXR1cm4gbm9kZS5mb3JFYWNoKHggPT4gd2Fsayh4LCBmbnMpKVxuICBjb25zdCBjaGlsZHJlbiA9ICguLi52YWx1ZXM6IGFueVtdKSA9PiB2YWx1ZXMuZm9yRWFjaCh4ID0+IHdhbGsoeCwgZm5zKSlcbiAgc3dpdGNoIChub2RlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjogY2FzZSBcImJyZWFrXCI6IGNhc2UgXCJjb250aW51ZVwiOiByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6IGZucy5sb2NhbD8uKG5vZGUubG9jYWwsIG5vZGUudHlwZSk7IHJldHVyblxuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjogZm5zLmxvY2FsPy4obm9kZS5sb2NhbCwgbm9kZS50eXBlKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJnbG9iYWwuZ2V0XCI6IGZucy5nbG9iYWw/Lihub2RlKTsgcmV0dXJuXG4gICAgY2FzZSBcImdsb2JhbC5zZXRcIjogZm5zLmdsb2JhbD8uKG5vZGUuZ2xvYmFsKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJiaW5cIjogY2FzZSBcImNtcFwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5sZWZ0LCBub2RlLnJpZ2h0KVxuICAgIGNhc2UgXCJjYWxsXCI6IGNhc2UgXCJjYWxsLnZvaWRcIjogZm5zLmZ1bmM/Lihub2RlLnRhcmdldCk7IHJldHVybiB3YWxrKG5vZGUuYXJncywgZm5zKVxuICAgIGNhc2UgXCJjYXN0XCI6IGNhc2UgXCJyZXR1cm5cIjogcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJpZlwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5jb25kLCBub2RlLnRoZW4sIG5vZGUuZWxzZSlcbiAgICBjYXNlIFwibG9hZFwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIHdhbGsobm9kZS5pbmRleCwgZm5zKVxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIGNoaWxkcmVuKG5vZGUuaW5kZXgsIG5vZGUudmFsdWUpXG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiBjaGlsZHJlbihub2RlLnRhcmdldCwgbm9kZS5zb3VyY2UsIG5vZGUuY291bnQpXG4gICAgY2FzZSBcImJsb2NrXCI6IHJldHVybiB3YWxrKG5vZGUuYm9keSwgZm5zKVxuICAgIGNhc2UgXCJsb29wXCI6IHJldHVybiBjaGlsZHJlbihub2RlLmNvbmQsIG5vZGUuYm9keSlcbiAgICBjYXNlIFwidHJhcFwiOiBmbnMudHJhcD8uKG5vZGUubWVzc2FnZSk7IHJldHVyblxuICAgIGNhc2UgXCJsb2dcIjogZm5zLmxvZz8uKG5vZGUubWVzc2FnZSk7IHJldHVybiB3YWxrKG5vZGUudmFsdWUsIGZucylcbiAgICBjYXNlIFwiZXhwclwiOiByZXR1cm4gd2Fsayhub2RlLmV4cHIsIGZucylcbiAgICBkZWZhdWx0OiBkaWUobm9kZSlcbiAgfVxufVxuXG5cbmNvbnN0IGFycmF5TGF5b3V0cyA9IChhcnJheXM6IEFueUFycmF5W10pID0+IHtcbiAgbGV0IG9mZnNldCA9IDBcbiAgY29uc3QgbGF5b3V0cyA9IG5ldyBNYXA8QW55QXJyYXksIEFycmF5TGF5b3V0PigpXG4gIGZvciAoY29uc3QgYXJyIG9mIGFycmF5cykge1xuICAgIGNvbnN0IGFsaWduID0gTWF0aC5taW4oYXJyLmVsZW1lbnRTaXplLCA4KVxuICAgIG9mZnNldCA9IE1hdGguY2VpbChvZmZzZXQgLyBhbGlnbikgKiBhbGlnblxuICAgIGxheW91dHMuc2V0KGFyciwgeyBsZW5ndGg6IGFyci5sZW5ndGgsIG9mZnNldCwgZWxlbWVudFNpemU6IGFyci5lbGVtZW50U2l6ZSB9KVxuICAgIG9mZnNldCArPSBhcnIubGVuZ3RoICogYXJyLmVsZW1lbnRTaXplXG4gIH1cbiAgcmV0dXJuIHsgbGF5b3V0cywgYnl0ZXM6IG9mZnNldCB9XG59XG5cbmV4cG9ydCB0eXBlIEJ1aWx0RnVuYyA9IHtcbiAgZnVuYzogQW55RnVuY1xuICBidWlsdDogRnVuY0JvZHk8UmVzdWx0VHlwZT5cbiAgbG9jYWxzOiBbbnVtYmVyLCBOdW1UeXBlXVtdXG4gIGxvY2FsSW5kZXhlczogUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICBmdW5jdGlvbnM6IEFueUZ1bmNbXVxuICBhcnJheXM6IEFueUFycmF5W11cbiAgdHJhcHM6IHN0cmluZ1tdXG4gIGxvZ3M6IHN0cmluZ1tdXG4gIGdsb2JhbHM6IEFueUdsb2JhbFtdXG59XG5cbmNvbnN0IGJ1aWxkRnVuYyA9IChmdW5jOiBBbnlGdW5jKTogQnVpbHRGdW5jID0+IHtcbiAgY29uc3QgcGFyYW1zID0gZnVuYy5wYXJhbXMubWFwKHR5cGUgPT4gYWxsb2NhdGVMb2NhbCh0eXBlKSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gIGNvbnN0IHBhcmFtSWRzID0gcGFyYW1zLm1hcChwID0+IHAua2luZCA9PT0gXCJsb2NhbC5nZXRcIiA/IHAubG9jYWwgOiAtMSlcbiAgY29uc3QgcmVzdWx0ID0gZnVuYy5idWlsZCguLi5wYXJhbXMpXG4gIGNvbnN0IGJ1aWx0ID0gdHlwZW9mIGZ1bmMucmVzdWx0ID09PSBcIm9iamVjdFwiICYmICFhc1N0bXRzKHJlc3VsdCkgPyByZXN1bHQucGFja2VkIDogcmVzdWx0XG4gIGNvbnN0IGZvdW5kID0gbmV3IE1hcDxudW1iZXIsIE51bVR5cGU+KClcbiAgY29uc3QgZnVuY3Rpb25zID0gbmV3IFNldDxBbnlGdW5jPigpLCBhcnJheXMgPSBuZXcgU2V0PEFueUFycmF5PigpLCBnbG9iYWxzID0gbmV3IFNldDxBbnlHbG9iYWw+KCksIHRyYXBzID0gbmV3IFNldDxzdHJpbmc+KCksIGxvZ3MgPSBuZXcgU2V0PHN0cmluZz4oKVxuICB3YWxrKGJ1aWx0LCB7XG4gICAgbG9jYWw6IChpZCwgdHlwZSkgPT4gZm91bmQuc2V0KGlkLCB0eXBlKSwgZnVuYzogZiA9PiBmdW5jdGlvbnMuYWRkKGYpLCBhcnJheTogYSA9PiBhcnJheXMuYWRkKGEpLFxuICAgIGdsb2JhbDogdmFsdWUgPT4gZ2xvYmFscy5hZGQodmFsdWUpLCB0cmFwOiBtZXNzYWdlID0+IHRyYXBzLmFkZChtZXNzYWdlKSwgbG9nOiBtZXNzYWdlID0+IGxvZ3MuYWRkKG1lc3NhZ2UpLFxuICB9KVxuICBwYXJhbUlkcy5mb3JFYWNoKGlkID0+IGZvdW5kLmRlbGV0ZShpZCkpXG4gIGNvbnN0IGxvY2FscyA9IFsuLi5mb3VuZC5lbnRyaWVzKCldXG4gIGNvbnN0IGxvY2FsSW5kZXhlcyA9IE9iamVjdC5mcm9tRW50cmllcyhbXG4gICAgLi4ucGFyYW1JZHMubWFwKChpZCwgaSkgPT4gW2lkLCBpXSksXG4gICAgLi4ubG9jYWxzLm1hcCgoW2lkXSwgaSkgPT4gW2lkLCBmdW5jLnBhcmFtcy5sZW5ndGggKyBpXSksXG4gIF0pXG4gIHJldHVybiB7IGZ1bmMsIGJ1aWx0LCBsb2NhbHMsIGxvY2FsSW5kZXhlcywgZnVuY3Rpb25zOiBbLi4uZnVuY3Rpb25zXSwgYXJyYXlzOiBbLi4uYXJyYXlzXSwgZ2xvYmFsczogWy4uLmdsb2JhbHNdLCB0cmFwczogWy4uLnRyYXBzXSwgbG9nczogWy4uLmxvZ3NdIH1cbn1cblxuY29uc3QgYnVpbGRSZWZlcmVuY2VkRnVuY3Rpb25zID0gKHJvb3RzOiBBbnlGdW5jW10pID0+IHtcbiAgY29uc3QgYnVpbHQgPSBuZXcgTWFwPEFueUZ1bmMsIEJ1aWx0RnVuYz4oKVxuICBjb25zdCB2aXNpdCA9IChmdW5jOiBBbnlGdW5jKSA9PiB7XG4gICAgaWYgKGJ1aWx0LmhhcyhmdW5jKSkgcmV0dXJuXG4gICAgY29uc3QgZW50cnkgPSBidWlsZEZ1bmMoZnVuYylcbiAgICBidWlsdC5zZXQoZnVuYywgZW50cnkpXG4gICAgZW50cnkuZnVuY3Rpb25zLmZvckVhY2godmlzaXQpXG4gIH1cbiAgcm9vdHMuZm9yRWFjaCh2aXNpdClcbiAgcmV0dXJuIFsuLi5idWlsdC52YWx1ZXMoKV1cbn1cblxuZXhwb3J0IGNvbnN0IGFuYWx5emVNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PiB7XG4gIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhtb2QpXG4gIGNvbnN0IGZ1bmNzID0gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImZ1bmNcIikpIGFzIEZ1bmNEZWZzPFQ+XG4gIGNvbnN0IGFycmF5cyA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzLmZpbHRlcigoWywgdl0pID0+IHYua2luZCA9PT0gXCJhcnJheVwiKSkgYXMgQXJyYXlEZWZzPFQ+XG4gIGNvbnN0IGZFbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZnVuY3MpIGFzIFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGNvbnN0IGJ1aWx0RnVuY3MgPSBidWlsZFJlZmVyZW5jZWRGdW5jdGlvbnMoZkVudHJpZXMubWFwKChbLCBmdW5jXSkgPT4gZnVuYykpXG4gIGNvbnN0IGZpeCA9IG5ldyBNYXAoYnVpbHRGdW5jcy5tYXAoKHsgZnVuYyB9LCBpKSA9PiBbZnVuYywgaV0pKVxuICBjb25zdCBhbGxBcnJheXMgPSBbLi4ubmV3IFNldChbLi4uYnVpbHRGdW5jcy5mbGF0TWFwKGZ1bmMgPT4gZnVuYy5hcnJheXMpLCAuLi5PYmplY3QudmFsdWVzKGFycmF5cykgYXMgQW55QXJyYXlbXV0pXVxuICBjb25zdCBhbGxHbG9iYWxzID0gWy4uLm5ldyBTZXQoWy4uLmJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMuZ2xvYmFscyksIC4uLmVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImdsb2JhbC5nZXRcIikubWFwKChbLCB2XSkgPT4gdiBhcyBBbnlHbG9iYWwpXSldXG4gIGNvbnN0IGdsb2JhbHMgPSBuZXcgTWFwKGFsbEdsb2JhbHMubWFwKCh2YWx1ZSwgaSkgPT4gW3ZhbHVlLCBpXSkpXG4gIGNvbnN0IHsgbGF5b3V0cywgYnl0ZXMgfSA9IGFycmF5TGF5b3V0cyhhbGxBcnJheXMpXG4gIGNvbnN0IHRyYXBNZXNzYWdlcyA9IFsuLi5uZXcgU2V0KGJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMudHJhcHMpKV1cbiAgY29uc3QgbG9nTWVzc2FnZXMgPSBbLi4ubmV3IFNldChidWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmxvZ3MpKV1cbiAgcmV0dXJuIHsgZnVuY3MsIGFycmF5cywgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgZ2xvYmFscywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXM6IE1hdGgubWF4KDEsIE1hdGguY2VpbChieXRlcyAvIDY1NTM2KSkgfSBhcyBNb2R1bGVBbmFseXNpczxUPlxufVxuIiwKICAgICJpbXBvcnQge1xuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUV4cHIsIHR5cGUgQW55RnVuYywgdHlwZSBBbnlHbG9iYWwsIHR5cGUgQXJpdGhtZXRpY09wLCB0eXBlIEJpdE9wLCB0eXBlIENtcE9wLCB0eXBlIEV4cHIsXG4gIHR5cGUgTWVtb3J5VHlwZSwgdHlwZSBNb2R1bGVEZWYsIHR5cGUgTnVtVHlwZSwgdHlwZSBSZW1haW5kZXJPcCwgdHlwZSBTdG10LCBhc1N0bXRzLFxufSBmcm9tIFwiLi9hc3RcIlxuaW1wb3J0IHsgdHlwZSBBcnJheUxheW91dCwgdHlwZSBNb2R1bGVBbmFseXNpcyB9IGZyb20gXCIuL2FuYWx5emVcIlxuXG5jb25zdCBtYWdpYyA9IFsweDAwLCAweDYxLCAweDczLCAweDZkLCAweDAxLCAweDAwLCAweDAwLCAweDAwXVxuY29uc3QgcmVzdWx0VHlwZSA9IChyZXN1bHQ6IEFueUZ1bmNbXCJyZXN1bHRcIl0pID0+XG4gIHR5cGVvZiByZXN1bHQgPT09IFwib2JqZWN0XCIgPyByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiIDogcmVzdWx0XG5cbmNvbnN0IG51bWJlckJhc2UgPSB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+XG5jb25zdCBvcGNvZGUgPSAob3A6IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3AgfCBDbXBPcCwgdHlwZTogTnVtVHlwZSkgPT4ge1xuICBjb25zdCBhcml0aG1ldGljID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdLmluZGV4T2Yob3ApXG4gIGlmIChhcml0aG1ldGljID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgYXJpdGhtZXRpY1xuICBjb25zdCBpbnRlZ2VyID0gW1wibW9kXCIsIFwidW1vZFwiLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwiXCIsIFwic2hyXCJdLmluZGV4T2Yob3ApXG4gIGlmIChpbnRlZ2VyID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgNSArIGludGVnZXJcbiAgcmV0dXJuICh7IGkzMjogMHg0NiwgaTY0OiAweDUxLCBmMzI6IDB4NWIsIGY2NDogMHg2MSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+KVt0eXBlXVxuICAgICsgKG9wID09PSBcImVxXCIgPyAwIDogb3AgPT09IFwibHRcIiA/IDIgOiB0eXBlWzBdID09PSBcImlcIiA/IDQgOiAzKVxufVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgbG9hZDogeyBpMzI6IDB4MjgsIGk2NDogMHgyOSwgZjMyOiAweDJhLCBmNjQ6IDB4MmIsIGk4OiAweDJjLCB1ODogMHgyZCwgaTE2OiAweDJlLCB1MTY6IDB4MmYgfSBhcyBSZWNvcmQ8TWVtb3J5VHlwZSwgbnVtYmVyPixcbiAgc3RvcmU6IHsgaTMyOiAweDM2LCBpNjQ6IDB4MzcsIGYzMjogMHgzOCwgZjY0OiAweDM5LCBpODogMHgzYSwgdTg6IDB4M2EsIGkxNjogMHgzYiwgdTE2OiAweDNiIH0gYXMgUmVjb3JkPE1lbW9yeVR5cGUsIG51bWJlcj4sXG4gIGFsaWduOiB7IGk4OiAwLCB1ODogMCwgaTE2OiAxLCB1MTY6IDEsIGkzMjogMiwgZjMyOiAyLCBpNjQ6IDMsIGY2NDogMyB9IGFzIFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+LFxuICB6ZXJvOiB7IGkzMjogWzB4NDEsIDBdLCBpNjQ6IFsweDQyLCAwXSwgZjMyOiBbMHg0MywgMCwgMCwgMCwgMF0sIGY2NDogWzB4NDQsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcltdPixcbn1cblxuY29uc3QgdTMyID0gKG46IG51bWJlcikgPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdW5zaWduZWQgaW50ZWdlciwgZ290ICR7bn1gKVxuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgZG8ge1xuICAgIGxldCBieXRlID0gbiAmIDB4N2ZcbiAgICBuID4+Pj0gN1xuICAgIGlmIChuKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICB9IHdoaWxlIChuKVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IHNOID0gKHZhbHVlOiBudW1iZXIgfCBiaWdpbnQsIGJpdHM6IDMyIHwgNjQpID0+IHtcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGxldCBuID0gYml0cyA9PT0gMzIgPyBCaWdJbnQoKHZhbHVlIGFzIG51bWJlcikgfCAwKSA6IEJpZ0ludC5hc0ludE4oNjQsIHZhbHVlIGFzIGJpZ2ludClcbiAgZm9yICg7Oykge1xuICAgIGxldCBieXRlID0gTnVtYmVyKG4gJiAweDdmbilcbiAgICBuID4+PSA3blxuICAgIGNvbnN0IGRvbmUgPSAobiA9PT0gMG4gJiYgKGJ5dGUgJiAweDQwKSA9PT0gMCkgfHwgKG4gPT09IC0xbiAmJiAoYnl0ZSAmIDB4NDApICE9PSAwKVxuICAgIGlmICghZG9uZSkgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgICBpZiAoZG9uZSkgcmV0dXJuIG91dFxuICB9XG59XG5cbmNvbnN0IGZOID0gKHZhbHVlOiBudW1iZXIsIGJ5dGVzOiA0IHwgOCkgPT4ge1xuICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShieXRlcylcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhvdXQuYnVmZmVyKVxuICBieXRlcyA9PT0gNCA/IHZpZXcuc2V0RmxvYXQzMigwLCB2YWx1ZSwgdHJ1ZSkgOiB2aWV3LnNldEZsb2F0NjQoMCwgdmFsdWUsIHRydWUpXG4gIHJldHVybiBbLi4ub3V0XVxufVxuXG5jb25zdCBnbG9iYWxJbml0ID0gKHZhbHVlOiBBbnlHbG9iYWwpID0+XG4gIHZhbHVlLnR5cGUgPT09IFwiaTMyXCIgPyBbMHg0MSwgLi4uc04odmFsdWUuaW5pdGlhbCBhcyBudW1iZXIsIDMyKV0gOlxuICB2YWx1ZS50eXBlID09PSBcImk2NFwiID8gWzB4NDIsIC4uLnNOKHZhbHVlLmluaXRpYWwsIDY0KV0gOlxuICB2YWx1ZS50eXBlID09PSBcImYzMlwiID8gWzB4NDMsIC4uLmZOKHZhbHVlLmluaXRpYWwgYXMgbnVtYmVyLCA0KV0gOlxuICBbMHg0NCwgLi4uZk4odmFsdWUuaW5pdGlhbCBhcyBudW1iZXIsIDgpXVxuXG5jb25zdCBzdHIgPSAoczogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpXG4gIHJldHVybiBbLi4udTMyKGJ5dGVzLmxlbmd0aCksIC4uLmJ5dGVzXVxufVxuXG5jb25zdCBzZWN0aW9uID0gKGlkOiBudW1iZXIsIHBheWxvYWQ6IG51bWJlcltdKSA9PiBbaWQsIC4uLnUzMihwYXlsb2FkLmxlbmd0aCksIC4uLnBheWxvYWRdXG5jb25zdCBmbGF0TWFwID0gPFQsIFI+KHhzOiBUW10sIGZuOiAoeDogVCkgPT4gUltdKSA9PiB4cy5mbGF0TWFwKGZuKVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5cbmNvbnN0IGFkZHIgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZSA9IGxheW91dC5lbGVtZW50U2l6ZSwgZmllbGRPZmZzZXQgPSAwKSA9PlxuICBpbmRleC5tdWwoc3RyaWRlKS5hZGQobGF5b3V0Lm9mZnNldCArIGZpZWxkT2Zmc2V0KVxuY29uc3QgbWVtYXJnID0gKHR5cGU6IE1lbW9yeVR5cGUsIG9mZnNldCA9IDApID0+IFsuLi51MzIoY29kZXMuYWxpZ25bdHlwZV0pLCAuLi51MzIob2Zmc2V0KV1cbmNvbnN0IGNvbnN0STMyID0gKGU6IEV4cHI8XCJpMzJcIj4pID0+IGUua2luZCA9PT0gXCJjb25zdFwiID8gZS52YWx1ZSA6IG51bGxcbmNvbnN0IGNoZWNrQXJyYXlCb3VuZHMgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgbiA9IGNvbnN0STMyKGluZGV4KVxuICBpZiAobiA9PSBudWxsKSByZXR1cm5cbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pIHx8IG4gPCAwIHx8IG4gPj0gbGF5b3V0Lmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGBBcnJheSBpbmRleCAke259IG91dCBvZiBib3VuZHMgZm9yIGxlbmd0aCAke2xheW91dC5sZW5ndGh9YClcbn1cbmNvbnN0IGNoZWNrTW92ZUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCB0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgdmFsdWVzID0gW2NvbnN0STMyKHRhcmdldCksIGNvbnN0STMyKHNvdXJjZSksIGNvbnN0STMyKGNvdW50KV1cbiAgaWYgKHZhbHVlcy5zb21lKHZhbHVlID0+IHZhbHVlID09IG51bGwpKSByZXR1cm5cbiAgY29uc3QgW3RvLCBmcm9tLCBzaXplXSA9IHZhbHVlcyBhcyBudW1iZXJbXVxuICBpZiAodG8hIDwgMCB8fCBmcm9tISA8IDAgfHwgc2l6ZSEgPCAwIHx8IHRvISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aCB8fCBmcm9tISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IG1vdmUgKCR7dG99LCAke2Zyb219LCAke3NpemV9KSBvdXQgb2YgYm91bmRzIGZvciBsZW5ndGggJHtsYXlvdXQubGVuZ3RofWApXG59XG5cbmNvbnN0IG1ha2VDb21waWxlciA9IChcbiAgZml4OiBNYXA8QW55RnVuYywgbnVtYmVyPiwgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LCBhcnJheXM6IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+LFxuICB0cmFwczogTWFwPHN0cmluZywgbnVtYmVyPiwgbG9nczogTWFwPHN0cmluZywgbnVtYmVyPiwgZ2xvYmFsczogTWFwPEFueUdsb2JhbCwgbnVtYmVyPixcbikgPT4ge1xuY29uc3QgY29tcGlsZUV4cHIgPSAoZTogQW55RXhwcik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjpcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTMyXCIpIHJldHVybiBbMHg0MSwgLi4uc04oZS52YWx1ZSBhcyBudW1iZXIsIDMyKV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTY0XCIpIHJldHVybiBbMHg0MiwgLi4uc04oZS52YWx1ZSwgNjQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmMzJcIikgcmV0dXJuIFsweDQzLCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgNCldXG4gICAgICBpZiAoZS50eXBlID09PSBcImY2NFwiKSByZXR1cm4gWzB4NDQsIC4uLmZOKGUudmFsdWUgYXMgbnVtYmVyLCA4KV1cbiAgICAgIHJldHVybiBkaWUoZSlcbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6XG4gICAgICByZXR1cm4gWzB4MjAsIC4uLnUzMihsaXhbZS5sb2NhbF0hKV1cbiAgICBjYXNlIFwiZ2xvYmFsLmdldFwiOlxuICAgICAgcmV0dXJuIFsweDIzLCAuLi51MzIoZ2xvYmFscy5nZXQoZSkhKV1cbiAgICBjYXNlIFwiYmluXCI6IHtcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5sZWZ0KSwgLi4uY29tcGlsZUV4cHIoZS5yaWdodCksIG9wY29kZShlLm9wLCBlLnR5cGUpXVxuICAgIH1cbiAgICBjYXNlIFwiY21wXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQpLCBvcGNvZGUoZS5vcCwgZS5pbnB1dFR5cGUpXVxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICByZXR1cm4gWy4uLmZsYXRNYXAoZS5hcmdzLCBjb21waWxlRXhwciksIDB4MTAsIC4uLnUzMihmaXguZ2V0KGUudGFyZ2V0KSEgKyAyKV1cbiAgICBjYXNlIFwiY2FzdFwiOiB7XG4gICAgICBjb25zdCBmcm9tID0gZS5pbnB1dFR5cGUgYXMgTnVtVHlwZVxuICAgICAgY29uc3QgdG8gPSBlLnR5cGUgYXMgTnVtVHlwZVxuICAgICAgbGV0IG9wY29kZTogbnVtYmVyIHwgdW5kZWZpbmVkXG4gICAgICBpZiAodG8gPT09IFwiaTMyXCIgJiYgZnJvbSA9PT0gXCJpNjRcIikgb3Bjb2RlID0gMHhhN1xuICAgICAgaWYgKHRvID09PSBcImkzMlwiICYmIGZyb20gPT09IFwiZjMyXCIpIG9wY29kZSA9IDB4YThcbiAgICAgIGlmICh0byA9PT0gXCJpMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGFhXG4gICAgICBpZiAodG8gPT09IFwiaTY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gZS51bnNpZ25lZCA/IDB4YWQgOiAweGFjXG4gICAgICBpZiAodG8gPT09IFwiZjMyXCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiMlxuICAgICAgaWYgKHRvID09PSBcImYzMlwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjRcbiAgICAgIGlmICh0byA9PT0gXCJmMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGI2XG4gICAgICBpZiAodG8gPT09IFwiZjY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiN1xuICAgICAgaWYgKHRvID09PSBcImY2NFwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjlcbiAgICAgIGlmICh0byA9PT0gXCJmNjRcIiAmJiBmcm9tID09PSBcImYzMlwiKSBvcGNvZGUgPSAweGJiXG4gICAgICBpZiAob3Bjb2RlID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY2FzdCAke2Zyb219IC0+ICR7dG99YClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS52YWx1ZSksIG9wY29kZV1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUuY29uZCksIDB4MDQsIGNvZGVzLnR5cGVbZS50eXBlIGFzIE51bVR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4pLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UpLCAweDBiXVxuICAgIGNhc2UgXCJsb2FkXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQoZS5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtlLmFycmF5fWApXG4gICAgICBjaGVja0FycmF5Qm91bmRzKGxheW91dCwgZS5pbmRleClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIGUuaW5kZXgsIGUuc3RyaWRlLCBlLm9mZnNldCkpLCBjb2Rlcy5sb2FkW2Uuc3RvcmFnZSBhcyBNZW1vcnlUeXBlXSwgLi4ubWVtYXJnKGUuc3RvcmFnZSBhcyBNZW1vcnlUeXBlKV1cbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUoZSlcbiAgfVxufVxuXG50eXBlIExhYmVsRnJhbWUgPSB7IGNvbnRyb2w/OiBudW1iZXIsIGtpbmQ/OiBcImJyZWFrXCIgfCBcImNvbnRpbnVlXCIgfVxuY29uc3QgZGVwdGggPSAoc3RhY2s6IExhYmVsRnJhbWVbXSwgY29udHJvbDogbnVtYmVyLCBraW5kOiBOb25OdWxsYWJsZTxMYWJlbEZyYW1lW1wia2luZFwiXT4pID0+IHtcbiAgY29uc3QgaSA9IHN0YWNrLmZpbmRJbmRleCh4ID0+IHguY29udHJvbCA9PT0gY29udHJvbCAmJiB4LmtpbmQgPT09IGtpbmQpXG4gIGlmIChpIDwgMCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duICR7a2luZH0gdGFyZ2V0ICR7Y29udHJvbH1gKVxuICByZXR1cm4gaVxufVxuXG5jb25zdCBjb21waWxlU3RtdCA9IChzOiBTdG10LCBzdGFjazogTGFiZWxGcmFtZVtdID0gW10pOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAocy5raW5kKSB7XG4gICAgY2FzZSBcImxvY2FsLnNldFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgMHgyMSwgLi4udTMyKGxpeFtzLmxvY2FsXSEpXVxuICAgIGNhc2UgXCJnbG9iYWwuc2V0XCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMudmFsdWUpLCAweDI0LCAuLi51MzIoZ2xvYmFscy5nZXQocy5nbG9iYWwpISldXG4gICAgY2FzZSBcImFycmF5LnN0b3JlXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQocy5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtzLmFycmF5fWApXG4gICAgICBjaGVja0FycmF5Qm91bmRzKGxheW91dCwgcy5pbmRleClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIHMuaW5kZXgsIHMuc3RyaWRlLCBzLm9mZnNldCkpLCAuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgY29kZXMuc3RvcmVbcy50eXBlXSwgLi4ubWVtYXJnKHMudHlwZSldXG4gICAgfVxuICAgIGNhc2UgXCJhcnJheS5tb3ZlXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQocy5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtzLmFycmF5fWApXG4gICAgICBjaGVja01vdmVCb3VuZHMobGF5b3V0LCBzLnRhcmdldCwgcy5zb3VyY2UsIHMuY291bnQpXG4gICAgICByZXR1cm4gW1xuICAgICAgICAuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy50YXJnZXQpKSxcbiAgICAgICAgLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIHMuc291cmNlKSksXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKHMuY291bnQubXVsKGxheW91dC5lbGVtZW50U2l6ZSkpLFxuICAgICAgICAweGZjLCAweDBhLCAweDAwLCAweDAwLFxuICAgICAgXVxuICAgIH1cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy5jb25kKSwgMHgwNCwgMHg0MCwgLi4uZmxhdE1hcChzLnRoZW4sIHggPT4gY29tcGlsZVN0bXQoeCwgW3t9LCAuLi5zdGFja10pKSwgLi4uKHMuZWxzZS5sZW5ndGggPyBbMHgwNSwgLi4uZmxhdE1hcChzLmVsc2UsIHggPT4gY29tcGlsZVN0bXQoeCwgW3t9LCAuLi5zdGFja10pKV0gOiBbXSksIDB4MGJdXG4gICAgY2FzZSBcImJsb2NrXCI6XG4gICAgICByZXR1cm4gWzB4MDIsIDB4NDAsIC4uLmZsYXRNYXAocy5ib2R5LCB4ID0+IGNvbXBpbGVTdG10KHgsIFt7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJicmVha1wiIH0sIC4uLnN0YWNrXSkpLCAweDBiXVxuICAgIGNhc2UgXCJsb29wXCI6XG4gICAgICByZXR1cm4gWzB4MDIsIDB4NDAsIDB4MDMsIDB4NDAsIC4uLmNvbXBpbGVFeHByKHMuY29uZCksIDB4NDUsIDB4MGQsIC4uLnUzMigxKSwgLi4uZmxhdE1hcChzLmJvZHksIHggPT4gY29tcGlsZVN0bXQoeCwgW3sgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImNvbnRpbnVlXCIgfSwgeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiYnJlYWtcIiB9LCAuLi5zdGFja10pKSwgMHgwYywgLi4udTMyKDApLCAweDBiLCAweDBiXVxuICAgIGNhc2UgXCJicmVha1wiOlxuICAgICAgaWYgKHMudGFyZ2V0ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcImJyZWFrVG8oKSB1c2VkIG91dHNpZGUgYSBibG9jayBvciBsb29wXCIpXG4gICAgICByZXR1cm4gWzB4MGMsIC4uLnUzMihkZXB0aChzdGFjaywgcy50YXJnZXQsIFwiYnJlYWtcIikpXVxuICAgIGNhc2UgXCJjb250aW51ZVwiOlxuICAgICAgaWYgKHMudGFyZ2V0ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcImNvbnRpbnVlVG8oKSB1c2VkIG91dHNpZGUgYSBsb29wXCIpXG4gICAgICByZXR1cm4gWzB4MGMsIC4uLnUzMihkZXB0aChzdGFjaywgcy50YXJnZXQsIFwiY29udGludWVcIikpXVxuICAgIGNhc2UgXCJyZXR1cm5cIjpcbiAgICAgIHJldHVybiBbLi4uKHMudmFsdWUgPyBjb21waWxlRXhwcihzLnZhbHVlKSA6IFtdKSwgMHgwZl1cbiAgICBjYXNlIFwidHJhcFwiOlxuICAgICAgcmV0dXJuIFsweDQxLCAuLi5zTih0cmFwcy5nZXQocy5tZXNzYWdlKSEsIDMyKSwgMHgxMCwgMHgwMF1cbiAgICBjYXNlIFwibG9nXCI6XG4gICAgICByZXR1cm4gWzB4NDEsIC4uLnNOKGxvZ3MuZ2V0KHMubWVzc2FnZSkhLCAzMiksIC4uLmNvbXBpbGVFeHByKHMudmFsdWUpLCAweDEwLCAweDAxXVxuICAgIGNhc2UgXCJjYWxsLnZvaWRcIjpcbiAgICAgIHJldHVybiBbLi4uZmxhdE1hcChzLmFyZ3MsIGNvbXBpbGVFeHByKSwgMHgxMCwgLi4udTMyKGZpeC5nZXQocy50YXJnZXQpISArIDIpXVxuICAgIGNhc2UgXCJleHByXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMuZXhwciksIDB4MWFdXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUocylcbiAgfVxufVxucmV0dXJuIHsgZXhwcjogY29tcGlsZUV4cHIsIHN0bXQ6IGNvbXBpbGVTdG10IH1cbn1cblxuXG5leHBvcnQgY29uc3QgZW1pdE1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPih7IGZFbnRyaWVzLCBidWlsdEZ1bmNzLCBmaXgsIGxheW91dHMsIGdsb2JhbHMsIHRyYXBNZXNzYWdlcywgbG9nTWVzc2FnZXMsIHBhZ2VzIH06IE1vZHVsZUFuYWx5c2lzPFQ+KSA9PiB7XG4gIGNvbnN0IHRyYXBzID0gbmV3IE1hcCh0cmFwTWVzc2FnZXMubWFwKChtZXNzYWdlLCBpZCkgPT4gW21lc3NhZ2UsIGlkXSkpXG4gIGNvbnN0IGxvZ3MgPSBuZXcgTWFwKGxvZ01lc3NhZ2VzLm1hcCgobWVzc2FnZSwgaWQpID0+IFttZXNzYWdlLCBpZF0pKVxuICBjb25zdCBmdW5jdGlvblNlY3Rpb24gPSBidWlsdEZ1bmNzLmZsYXRNYXAoKF8sIGkpID0+IHUzMihpICsgMikpXG4gIGNvbnN0IGV4cG9ydFNlY3Rpb24gPSBmRW50cmllcy5mbGF0TWFwKChbbmFtZSwgZnVuY10pID0+IFsuLi5zdHIobmFtZSksIDB4MDAsIC4uLnUzMihmaXguZ2V0KGZ1bmMpISArIDIpXSlcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFtcbiAgICAuLi5tYWdpYyxcbiAgICAuLi5zZWN0aW9uKDB4MDEsIFsuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGggKyAyKSxcbiAgICAgIDB4NjAsIDB4MDEsIGNvZGVzLnR5cGUuaTMyLCAweDAwLFxuICAgICAgMHg2MCwgMHgwMiwgY29kZXMudHlwZS5pMzIsIGNvZGVzLnR5cGUuaTMyLCAweDAwLFxuICAgICAgLi4uZmxhdE1hcChidWlsdEZ1bmNzLCAoeyBmdW5jIH0pID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzdWx0VHlwZShmdW5jLnJlc3VsdClcbiAgICAgICAgcmV0dXJuIFsweDYwLCAuLi51MzIoZnVuYy5wYXJhbXMubGVuZ3RoKSwgLi4uZnVuYy5wYXJhbXMubWFwKHQgPT4gY29kZXMudHlwZVt0XSksIC4uLihyZXN1bHQgPT09IFwidm9pZFwiID8gWzB4MDBdIDogWzB4MDEsIGNvZGVzLnR5cGVbcmVzdWx0XV0pXVxuICAgICAgfSldKSxcbiAgICAuLi5zZWN0aW9uKDB4MDIsIFtcbiAgICAgIDB4MDMsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJ0cmFwXCIpLFxuICAgICAgMHgwMCxcbiAgICAgIDB4MDAsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJsb2dcIiksXG4gICAgICAweDAwLFxuICAgICAgMHgwMSxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcIm1lbW9yeVwiKSxcbiAgICAgIDB4MDIsXG4gICAgICAweDAzLFxuICAgICAgLi4udTMyKHBhZ2VzKSxcbiAgICAgIC4uLnUzMihwYWdlcyksXG4gICAgXSksXG4gICAgLi4uc2VjdGlvbigweDAzLCBbLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSwgLi4uZnVuY3Rpb25TZWN0aW9uXSksXG4gICAgLi4uKGdsb2JhbHMuc2l6ZSA/IHNlY3Rpb24oMHgwNiwgWy4uLnUzMihnbG9iYWxzLnNpemUpLCAuLi5bLi4uZ2xvYmFsc10uZmxhdE1hcCgoW3ZhbHVlXSkgPT4gW2NvZGVzLnR5cGVbdmFsdWUudHlwZV0sIDB4MDEsIC4uLmdsb2JhbEluaXQodmFsdWUpLCAweDBiXSldKSA6IFtdKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZXhwb3J0U2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgW1xuICAgICAgLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYywgYnVpbHQsIGxvY2FscywgbG9jYWxJbmRleGVzIH0pID0+IHtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBtYWtlQ29tcGlsZXIoZml4LCBsb2NhbEluZGV4ZXMsIGxheW91dHMsIHRyYXBzLCBsb2dzLCBnbG9iYWxzKVxuICAgICAgICBjb25zdCBzdG10cyA9IGFzU3RtdHMoYnVpbHQpXG4gICAgICAgIGNvbnN0IGRlY2xzID0gWy4uLnUzMihsb2NhbHMubGVuZ3RoKSwgLi4uZmxhdE1hcChsb2NhbHMsIChbLCB0eXBlXSkgPT4gWy4uLnUzMigxKSwgY29kZXMudHlwZVt0eXBlXV0pXVxuICAgICAgICBjb25zdCByZXN1bHQgPSByZXN1bHRUeXBlKGZ1bmMucmVzdWx0KVxuICAgICAgICBjb25zdCBjb2RlID0gc3RtdHNcbiAgICAgICAgICA/IFsuLi5mbGF0TWFwKHN0bXRzLCBzID0+IGNvbXBpbGVyLnN0bXQocykpLCAuLi4ocmVzdWx0ID09PSBcInZvaWRcIiA/IFtdIDogY29kZXMuemVyb1tyZXN1bHRdKV1cbiAgICAgICAgICA6IGNvbXBpbGVyLmV4cHIoYnVpbHQgYXMgQW55RXhwcilcbiAgICAgICAgY29uc3QgYm9keSA9IFsuLi5kZWNscywgLi4uY29kZSwgMHgwYl1cbiAgICAgICAgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XVxuICAgICAgfSksXG4gICAgXSksXG4gIF0pXG59XG4iLAogICAgImV4cG9ydCAqIGZyb20gXCIuL2FzdFwiXG5leHBvcnQgeyBmb3JtYXRNb2R1bGUgfSBmcm9tIFwiLi9mb3JtYXRcIlxuXG5pbXBvcnQgeyBhbmFseXplTW9kdWxlIH0gZnJvbSBcIi4vYW5hbHl6ZVwiXG5pbXBvcnQgeyBlbWl0TW9kdWxlIH0gZnJvbSBcIi4vY29kZWdlblwiXG5pbXBvcnQgdHlwZSB7XG4gIEFueUFycmF5LCBBbnlGdW5jLCBDb21waWxlUmVzdWx0LCBKU1N0cnVjdCwgTW9kdWxlRGVmLCBTdHJ1Y3RGaWVsZHMsIFN0cnVjdFR5cGUsXG59IGZyb20gXCIuL2FzdFwiXG5cbmNvbnN0IGFycmF5Q3RvcnMgPSB7XG4gIGk4OiBJbnQ4QXJyYXksIHU4OiBVaW50OEFycmF5LCBpMTY6IEludDE2QXJyYXksIHUxNjogVWludDE2QXJyYXksXG4gIGkzMjogSW50MzJBcnJheSwgaTY0OiBCaWdJbnQ2NEFycmF5LCBmMzI6IEZsb2F0MzJBcnJheSwgZjY0OiBGbG9hdDY0QXJyYXksXG4gIHN1ODogVWludDhBcnJheSwgc3UxNjogVWludDE2QXJyYXksIHNpMzI6IFVpbnQzMkFycmF5LCBzaTY0OiBCaWdVaW50NjRBcnJheSxcbn1cblxuZXhwb3J0IGNvbnN0IGRlY29kZVN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCByYXc6IG51bWJlciB8IGJpZ2ludCk6IEpTU3RydWN0PEY+ID0+IHtcbiAgY29uc3QgcGFja2VkID0gQmlnSW50LmFzVWludE4odHlwZS5zaXplICogOCwgQmlnSW50KHJhdykpXG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXModHlwZS5sYXlvdXQpLm1hcCgoW25hbWUsIGZpZWxkXSkgPT4ge1xuICAgIGNvbnN0IG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgbGV0IHZhbHVlID0gKHBhY2tlZCA+PiBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkgJiBtYXNrXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgdmFsdWUgJiAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMgLSAxKSkpXG4gICAgICB2YWx1ZSAtPSAxbiA8PCBCaWdJbnQoZmllbGQuYml0cylcbiAgICByZXR1cm4gW25hbWUsIGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyB2YWx1ZSA6IE51bWJlcih2YWx1ZSldXG4gIH0pKSBhcyBKU1N0cnVjdDxGPlxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZSA9IGFzeW5jIDxUIGV4dGVuZHMgTW9kdWxlRGVmPihcbiAgbW9kOiBULFxuKTogUHJvbWlzZTxDb21waWxlUmVzdWx0PFQ+PiA9PiB7XG4gIGNvbnN0IGFuYWx5c2lzID0gYW5hbHl6ZU1vZHVsZShtb2QpXG4gIGNvbnN0IG1lbW9yeSA9IG5ldyBXZWJBc3NlbWJseS5NZW1vcnkoe1xuICAgIGluaXRpYWw6IGFuYWx5c2lzLnBhZ2VzLFxuICAgIG1heGltdW06IGFuYWx5c2lzLnBhZ2VzLFxuICAgIHNoYXJlZDogdHJ1ZSxcbiAgfSlcbiAgY29uc3QgY29tcGlsZWQgPSBhd2FpdCBXZWJBc3NlbWJseS5jb21waWxlKGVtaXRNb2R1bGUoYW5hbHlzaXMpLmJ1ZmZlcilcbiAgY29uc3QgdHJhcCA9IChpZDogbnVtYmVyKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYW5hbHlzaXMudHJhcE1lc3NhZ2VzW2lkXSA/PyBgVW5rbm93biBXQVNNIHRyYXAgJHtpZH1gKSB9XG4gIGNvbnN0IGxvZyA9IChpZDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiBjb25zb2xlLmxvZyhhbmFseXNpcy5sb2dNZXNzYWdlc1tpZF0gPz8gYFdBU00gbG9nICR7aWR9YCwgdmFsdWUpXG4gIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoY29tcGlsZWQsIHsgZW52OiB7IG1lbW9yeSwgdHJhcCwgbG9nIH0gfSlcbiAgY29uc3QgZnVuY0VudHJpZXMgPSBPYmplY3QuZW50cmllcyhhbmFseXNpcy5mdW5jcykgYXMgW3N0cmluZywgQW55RnVuY11bXVxuICBjb25zdCBqc0Z1bmNzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LCByZXN1bHRTdHJ1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBTdHJ1Y3RUeXBlPGFueT4+ID0ge31cbiAgZm9yIChjb25zdCBbbmFtZSwgZnVuY10gb2YgZnVuY0VudHJpZXMpIHtcbiAgICBjb25zdCB3YXNtRnVuYyA9IGluc3RhbmNlLmV4cG9ydHNbbmFtZV0gYXMgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gbnVtYmVyIHwgYmlnaW50XG4gICAganNGdW5jc1tuYW1lXSA9IHdhc21GdW5jXG4gICAgaWYgKHR5cGVvZiBmdW5jLnJlc3VsdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmVzdWx0U3RydWN0c1tuYW1lXSA9IGZ1bmMucmVzdWx0XG4gICAgICBqc0Z1bmNzW25hbWVdID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gZGVjb2RlU3RydWN0KGZ1bmMucmVzdWx0IGFzIFN0cnVjdFR5cGU8YW55Piwgd2FzbUZ1bmMoLi4uYXJncykpXG4gICAgfVxuICB9XG4gIGNvbnN0IGpzQXJyYXlzID0gKE9iamVjdC5lbnRyaWVzKGFuYWx5c2lzLmFycmF5cykgYXMgW3N0cmluZywgQW55QXJyYXldW10pLm1hcCgoW25hbWUsIGFycl0pID0+IHtcbiAgICBjb25zdCBsYXlvdXQgPSBhbmFseXNpcy5sYXlvdXRzLmdldChhcnIpIVxuICAgIGNvbnN0IGtleSA9IHR5cGVvZiBhcnIudHlwZSA9PT0gXCJzdHJpbmdcIiA/IGFyci50eXBlIDogYHMke2Fyci50eXBlLnN0b3JhZ2V9YFxuICAgIGNvbnN0IEN0b3IgPSBhcnJheUN0b3JzW2tleSBhcyBrZXlvZiB0eXBlb2YgYXJyYXlDdG9yc11cbiAgICByZXR1cm4gW25hbWUsIG5ldyBDdG9yKG1lbW9yeS5idWZmZXIsIGxheW91dC5vZmZzZXQsIGFyci5sZW5ndGgpXSBhcyBjb25zdFxuICB9KVxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihqc0Z1bmNzLCBPYmplY3QuZnJvbUVudHJpZXMoanNBcnJheXMpLCB7XG4gICAgbW9kOiBjb21waWxlZCwgbWVtb3J5LCByZXN1bHRTdHJ1Y3RzLFxuICAgIHRyYXBNZXNzYWdlczogYW5hbHlzaXMudHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlczogYW5hbHlzaXMubG9nTWVzc2FnZXMsXG4gIH0pIGFzIENvbXBpbGVSZXN1bHQ8VD5cbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgYXJyYXksIGNvbXBpbGUsIGV4cCwgZjMyLCBmdW5jLCBnbG9iYWwsIGkzMiwgaTY0dSwgaWZFbHNlLCBsaXQsIGxvY2FsLCBsb2csIGxvb3AsIHJldCwgc3RydWN0LCB0cmFwLCB0eXBlIEFueUFycmF5LCB0eXBlIEFycmF5SGFuZGxlLCB0eXBlIERUeXBlLCB0eXBlIEV4cHIsIHR5cGUgRXhwckxpa2UsIHR5cGUgU3RtdCwgdHlwZSBTdG10Qm9keSB9IGZyb20gXCIuLi93YXNtXCJcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCJcbmltcG9ydCB7IEFWR19TUEVFRF9LTUgsIElORiwgS01fQ09TVF9DRU5UUywgUkVPUkdfQ09TVF9DRU5UUyB9IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIlxuXG5jb25zdCBTRUFSQ0hfU1RFUFMgPSAxXzYwMF8wMDBcbmNvbnN0IFRFTVBfUEhBU0VTID0gMV8wMDBcbmNvbnN0IFNURVBTX1BFUl9QSEFTRSA9IE1hdGguZmxvb3IoU0VBUkNIX1NURVBTIC8gVEVNUF9QSEFTRVMpXG5jb25zdCBTVEFSVF9URU1QX0NFTlRTID0gNV8wMDBcbmNvbnN0IEVORF9URU1QX0NFTlRTID0gMFxuXG5jb25zdCBERUJVRyA9IGZhbHNlXG5cbmZ1bmN0aW9uIGRlYnVnICh0YWc6IHN0cmluZywgdmFsdWU6IEV4cHJMaWtlPFwiaTMyXCI+KXtcbiAgaWYgKCFERUJVRykgcmV0dXJuIFtdXG4gIHJldHVybiBbIGxvZyh0YWcsIHZhbHVlKSBdXG59XG5cbmZ1bmN0aW9uIGNoZWNrZWRBcnJheTxUIGV4dGVuZHMgRFR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4ge1xuICBjb25zdCBhcnIgPSBhcnJheSh0eXBlLCBsZW5ndGgpIGFzIEFueUFycmF5XG4gIGlmICghREVCVUcpIHJldHVybiBhcnIgYXMgQXJyYXlIYW5kbGU8VD5cblxuICBjb25zdCB7YXQsIG1vdmV9ID0gYXJyXG4gIGNvbnN0IGNoZWNrSWR4ID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChpLG4pPT4gaWZFbHNlKFxuICAgICAgaS5sdCgwKS5vcihuLmx0KDApKS5vciAobi5hZGQoaSkuZ3QoYXJyLmxlbmd0aCkpLFxuICAgICAgdHJhcCggXCJhcnJheSBib3VuZHMgZXhjZWVkZWRcIiksXG4gICAgICByZXQoaSlcbiAgICApXG4gICk7XG4gIGFyci5hdCA9IGluZGV4ID0+IGF0KGNoZWNrSWR4LmNhbGwoaW5kZXgsIDEpKVxuICBhcnIubW92ZSA9ICh0YXJnZXQsIHNvdXJjZSwgY291bnQpID0+IG1vdmUoXG4gICAgY2hlY2tJZHguY2FsbCh0YXJnZXQsIGNvdW50KSxcbiAgICBjaGVja0lkeC5jYWxsKHNvdXJjZSwgY291bnQpLFxuICAgIGNvdW50LFxuICApXG4gIHJldHVybiBhcnIgYXMgQXJyYXlIYW5kbGU8VD5cbn1cblxuZnVuY3Rpb24gZm9yTihuOiBudW1iZXIsIGJvZHk6IChpOiBFeHByPFwiaTMyXCI+KSA9PiBTdG10Qm9keSk6IFN0bXRCb2R5IHtcbiAgY29uc3QgaSA9IGxvY2FsKFwiaTMyXCIpXG4gIHJldHVybiBbaS5zZXQoMCksIGxvb3AoaS5sdChuKSwgW2JvZHkoaSksIGkuaWFkZCgxKV0pXVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYW5uZWFsaW5nV2FzbShwbGFubmVyOiBNb2R1bGUpOiBQcm9taXNlPEFubmVhbGluZ1Jlc3VsdD4ge1xuICBjb25zdCBUU0laRSA9IE1hdGguZmxvb3IocGxhbm5lci5OUkVRUyAvIHBsYW5uZXIuTlRSQU5TICogMi41ICogMiArIDEwKVxuICBjb25zdCBOUE9JTlRTID0gcGxhbm5lci5yb2FkbWFwLnBvaW50cy5sZW5ndGhcbiAgY29uc3QgU1RPUCA9IHN0cnVjdCh7XG4gICAgcmVxX2lkOiBbXCJ1MTZcIiwgMTBdLFxuICAgIGlzX2xvYWQ6IFtcInU4XCIsIDFdLFxuICAgIGRlY2s6IFtcInU4XCIsIDFdLFxuICB9KVxuICBjb25zdCBSRVEgPSBzdHJ1Y3Qoe1xuICAgIHN0YXJ0OiBcInUxNlwiLFxuICAgIGVuZDogXCJ1MTZcIixcbiAgICB2YWx1ZTogXCJ1MTZcIixcbiAgICBkZWFkbGluZTogXCJ1MTZcIixcbiAgfSlcblxuICBjb25zdCByYW5kU3RhdGUgICAgICA9IGdsb2JhbChcImkzMlwiLCAxKVxuICBjb25zdCBkaXN0cyAgICAgICAgICA9IGNoZWNrZWRBcnJheShcImkzMlwiLCBwbGFubmVyLlJTSVpFKVxuICBjb25zdCByZXF1ZXN0cyAgICAgICA9IGNoZWNrZWRBcnJheShSRVEsIHBsYW5uZXIuTlJFUVMpXG4gIGNvbnN0IGFzc2lnbmVkICAgICAgID0gY2hlY2tlZEFycmF5KFwidThcIiwgcGxhbm5lci5OUkVRUylcbiAgY29uc3Qgc2NoZWR1bGUgICAgICAgPSBjaGVja2VkQXJyYXkoU1RPUCwgcGxhbm5lci5OVFJBTlMgKiBUU0laRSlcbiAgY29uc3Qgc2NoZWRfc2l6ZSAgICAgPSBjaGVja2VkQXJyYXkoXCJpMTZcIiwgcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHJhdGluZ3MgICAgICAgID0gY2hlY2tlZEFycmF5KFwiaTMyXCIsIHBsYW5uZXIuTlRSQU5TKVxuICBjb25zdCB0cmFuX3Bvc2l0aW9ucyA9IGNoZWNrZWRBcnJheShcImkxNlwiLCBwbGFubmVyLk5UUkFOUylcblxuICBjb25zdCByYW5kTmV4dCA9IGZ1bmMoW10sIFwiaTMyXCIsICgpID0+IHtcbiAgICByZXR1cm4gW1xuICAgICAgcmFuZFN0YXRlLnNldChyYW5kU3RhdGUueG9yKHJhbmRTdGF0ZS5zaGwoMTMpKSksXG4gICAgICByYW5kU3RhdGUuc2V0KHJhbmRTdGF0ZS54b3IocmFuZFN0YXRlLnNocigxNykpKSxcbiAgICAgIHJhbmRTdGF0ZS5zZXQocmFuZFN0YXRlLnhvcihyYW5kU3RhdGUuc2hsKDUpKSksXG4gICAgICByZXQocmFuZFN0YXRlKSxcbiAgICBdXG4gIH0pXG4gIGNvbnN0IHJhbmRpbnQgPSBmdW5jKFtcImkzMlwiXSwgXCJpMzJcIiwgbWF4ID0+XG4gICAgaTMyKGk2NHUocmFuZE5leHQuY2FsbCgpKS5tdWwoaTY0dShtYXgpKS5zaHIoMzJuKSkpXG4gIGNvbnN0IGFjY2VwdEFubmVhbCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAocHJldmlvdXMsIG5leHQsIHRlbXBlcmF0dXJlKSA9PiBbXG4gICAgaWZFbHNlKHByZXZpb3VzLmd0KG5leHQpLFxuICAgICAgcmV0KHJhbmRpbnQuY2FsbCgxXzAwMF8wMDApLmx0KGkzMihleHAoXG4gICAgICAgIGYzMihuZXh0LnN1YihwcmV2aW91cykpLmRpdihmMzIodGVtcGVyYXR1cmUpKSxcbiAgICAgICkubXVsKDFfMDAwXzAwMCkpKSksXG4gICAgICByZXQoMSksXG4gICAgKSxcbiAgXSlcblxuICBjb25zdCByb2FkQ29zdCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAoZnJvbSwgdG8pID0+IHtcbiAgICBjb25zdCBhID0gbG9jYWwoXCJpMzJcIiksIGIgPSBsb2NhbChcImkzMlwiKSwgdG1wID0gbG9jYWwoXCJpMzJcIiksIGluZGV4ID0gbG9jYWwoXCJpMzJcIilcbiAgICByZXR1cm4gW1xuICAgICAgYS5zZXQoZnJvbSksIGIuc2V0KHRvKSxcbiAgICAgIGlmRWxzZShhLmx0KGIpLCBbdG1wLnNldChhKSwgYS5zZXQoYiksIGIuc2V0KHRtcCldKSxcbiAgICAgIGluZGV4LnNldChhLmFkZChiLm11bChOUE9JTlRTKSkpLFxuICAgICAgaWZFbHNlKGluZGV4Lmd0KHBsYW5uZXIuUlNJWkUpLCBpbmRleC5zZXQoaTMyKE5QT0lOVFMgKiogMikuc3ViKGluZGV4KSkpLFxuICAgICAgcmV0KGRpc3RzLmF0KGluZGV4KSksXG4gICAgXVxuICB9KVxuXG4gIGNvbnN0IHRyeUFzc2lnbiA9IGZ1bmMoW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHJlcV9pZCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQiA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG1wID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0c2l6ZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG9mZnNldCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgcHJldmlvdXNTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgbmV4dFNjb3JlID0gbG9jYWwoXCJpMzJcIilcblxuICAgIGNvbnN0IHNjaGVkVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pOiBTdG10Qm9keSA9PlxuICAgICAgICBzY2hlZHVsZS5tb3ZlKHRvZmZzZXQuYWRkKHRhcmdldCksIHRvZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHRvZmZzZXQuYWRkKGluZGV4KSksXG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHRyYW4uc2V0KHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUykpLFxuICAgICAgcmVxX2lkLnNldChyYW5kaW50LmNhbGwocGxhbm5lci5OUkVRUykpLFxuICAgICAgaWZFbHNlKGFzc2lnbmVkLmF0KHJlcV9pZCkuZXEoMSksIHJldCgpKSxcbiAgICAgIHRvZmZzZXQuc2V0KHRyYW4ubXVsKFRTSVpFKSksXG4gICAgICB0c2l6ZS5zZXQoc2NoZWRfc2l6ZS5hdCh0cmFuKSksXG4gICAgICBpZkVsc2UodHNpemUuZ3QoVFNJWkUgLSAyKSwgcmV0KCkpLFxuICAgICAgcHJldmlvdXNTY29yZS5zZXQocmF0aW5ncy5hdCh0cmFuKSksXG4gICAgICBBLnNldChyYW5kaW50LmNhbGwodHNpemUuYWRkKDEpKSksXG4gICAgICBCLnNldChBLmFkZChyYW5kaW50LmNhbGwoNCkpKSxcbiAgICAgIGlmRWxzZShCLmd0KHRzaXplKSwgQi5zZXQodHNpemUpKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEIuYWRkKDIpLCBCLCB0c2l6ZS5zdWIoQikpLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQS5hZGQoMSksIEEsIEIuc3ViKEEpKSxcbiAgICAgIHRtcC5zZXQocmFuZGludC5jYWxsKDIpKSxcbiAgICAgIHNjaGVkVmlldy5hdChBKS5zZXQoeyByZXFfaWQsIGlzX2xvYWQ6IDEsIGRlY2s6IHRtcCB9KSxcbiAgICAgIHNjaGVkVmlldy5hdChCLmFkZCgxKSkuc2V0KHsgcmVxX2lkLCBpc19sb2FkOiAwLCBkZWNrOiB0bXAgfSksXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZS5hZGQoMikpLFxuICAgICAgbmV4dFNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKSxcbiAgICAgIGlmRWxzZShhY2NlcHRBbm5lYWwuY2FsbChwcmV2aW91c1Njb3JlLCBuZXh0U2NvcmUsIHRlbXBlcmF0dXJlKSxcbiAgICAgICAgW2Fzc2lnbmVkLmF0KHJlcV9pZCkuc2V0KDEpLCByYXRpbmdzLmF0KHRyYW4pLnNldChuZXh0U2NvcmUpXSxcbiAgICAgICAgW1xuICAgICAgICAgIHNjaGVkVmlldy5tb3ZlKEEsIEEuYWRkKDEpLCBCLnN1YihBKSksXG4gICAgICAgICAgc2NoZWRWaWV3Lm1vdmUoQiwgQi5hZGQoMiksIHRzaXplLnN1YihCKSksXG4gICAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQodHNpemUpLFxuICAgICAgICBdLFxuICAgICAgKSxcbiAgICBdXG4gIH0pXG5cbiAgY29uc3QgcmF0ZVRyYW4gPSBmdW5jKFtcImkzMlwiXSwgXCJpMzJcIiwgdHJhbiA9PiB7XG4gICAgY29uc3QgcmV3YXJkID0gbG9jYWwoXCJpMzJcIiksIGNvc3QgPSBsb2NhbChcImkzMlwiKSwgZWxhcHNlZE1pbnV0ZXMgPSBsb2NhbChcImkzMlwiKSwgZGlzdGFuY2UgPSBsb2NhbChcImkzMlwiKSwgcG9zID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBvZmZzZXQgPSBsb2NhbChcImkzMlwiKSwgc2l6ZSA9IGxvY2FsKFwiaTMyXCIpLCBpID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBkZWNrMCA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrMSA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrU2l6ZTAgPSBsb2NhbChcImkzMlwiKSwgZGVja1NpemUxID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBkZWNrID0gbG9jYWwoXCJpMzJcIiksIGRlY2tTaXplID0gbG9jYWwoXCJpMzJcIiksIHJlcSA9IGxvY2FsKFwiaTMyXCIpLCBuZXh0UG9zID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBmb3VuZCA9IGxvY2FsKFwiaTMyXCIpLCBzaGlmdCA9IGxvY2FsKFwiaTMyXCIpLCBsb3dlck1hc2sgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHN0ZXAgPSBsb2NhbChTVE9QKSwgcmVxdWVzdCA9IGxvY2FsKFJFUSlcbiAgICByZXR1cm4gW1xuICAgICAgcG9zLnNldCh0cmFuX3Bvc2l0aW9ucy5hdCh0cmFuKSksXG4gICAgICBvZmZzZXQuc2V0KHRyYW4ubXVsKFRTSVpFKSksXG4gICAgICBzaXplLnNldChzY2hlZF9zaXplLmF0KHRyYW4pKSxcbiAgICAgIGxvb3AoaS5sdChzaXplKSwgW1xuICAgICAgICBzdGVwLnNldChzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGkpKSksXG4gICAgICAgIHJlcS5zZXQoc3RlcC5yZXFfaWQpLFxuICAgICAgICByZXF1ZXN0LnNldChyZXF1ZXN0cy5hdChyZXEpKSxcbiAgICAgICAgbmV4dFBvcy5zZXQoaWZFbHNlKHN0ZXAuaXNfbG9hZCwgcmVxdWVzdC5zdGFydCwgcmVxdWVzdC5lbmQpKSxcbiAgICAgICAgZGlzdGFuY2Uuc2V0KHJvYWRDb3N0LmNhbGwocG9zLCBuZXh0UG9zKSksXG4gICAgICAgIGNvc3QuaWFkZChkaXN0YW5jZS5tdWwoS01fQ09TVF9DRU5UUykpLFxuICAgICAgICBlbGFwc2VkTWludXRlcy5pYWRkKGRpc3RhbmNlLm11bCg2MCkuZGl2KEFWR19TUEVFRF9LTUgpKSxcbiAgICAgICAgcG9zLnNldChuZXh0UG9zKSxcbiAgICAgICAgZGVjay5zZXQoaWZFbHNlKHN0ZXAuZGVjaywgZGVjazEsIGRlY2swKSksXG4gICAgICAgIGRlY2tTaXplLnNldChpZkVsc2Uoc3RlcC5kZWNrLCBkZWNrU2l6ZTEsIGRlY2tTaXplMCkpLFxuICAgICAgICBpZkVsc2Uoc3RlcC5pc19sb2FkLCBbXG4gICAgICAgICAgaWZFbHNlKGRlY2tTaXplLmd0KDIpLCByZXQoLUlORikpLFxuICAgICAgICAgIGRlY2suc2V0KGRlY2sub3IocmVxLnNobChkZWNrU2l6ZS5tdWwoMTApKSkpLFxuICAgICAgICAgIGRlY2tTaXplLmlhZGQoMSksXG4gICAgICAgIF0sIFtcbiAgICAgICAgICBmb3VuZC5zZXQoLTEpLFxuICAgICAgICAgIGlmRWxzZShkZWNrU2l6ZS5ndCgwKS5hbmQoZGVjay5hbmQoMTAyMykuZXEocmVxKSksIGZvdW5kLnNldCgwKSksXG4gICAgICAgICAgaWZFbHNlKGZvdW5kLmVxKC0xKS5hbmQoZGVja1NpemUuZ3QoMSkpLmFuZChkZWNrLnNocigxMCkuYW5kKDEwMjMpLmVxKHJlcSkpLCBmb3VuZC5zZXQoMSkpLFxuICAgICAgICAgIGlmRWxzZShmb3VuZC5lcSgtMSkuYW5kKGRlY2tTaXplLmd0KDIpKS5hbmQoZGVjay5zaHIoMjApLmFuZCgxMDIzKS5lcShyZXEpKSwgZm91bmQuc2V0KDIpKSxcbiAgICAgICAgICBpZkVsc2UoZm91bmQuZXEoLTEpLCByZXQoLUlORikpLFxuICAgICAgICAgIGNvc3QuaWFkZChkZWNrU2l6ZS5zdWIoZm91bmQpLnN1YigxKS5tdWwoUkVPUkdfQ09TVF9DRU5UUykpLFxuICAgICAgICAgIHNoaWZ0LnNldChmb3VuZC5tdWwoMTApKSxcbiAgICAgICAgICBsb3dlck1hc2suc2V0KGkzMigxKS5zaGwoc2hpZnQpLnN1YigxKSksXG4gICAgICAgICAgZGVjay5zZXQoZGVjay5hbmQobG93ZXJNYXNrKS5vcihkZWNrLnNocihzaGlmdC5hZGQoMTApKS5zaGwoc2hpZnQpKSksXG4gICAgICAgICAgZGVja1NpemUuaXN1YigxKSxcbiAgICAgICAgICBpZkVsc2UoZWxhcHNlZE1pbnV0ZXMuZ3QocmVxdWVzdC5kZWFkbGluZSksIFtdLCByZXdhcmQuaWFkZChyZXF1ZXN0LnZhbHVlKSksXG4gICAgICAgIF0pLFxuICAgICAgICBpZkVsc2Uoc3RlcC5kZWNrLFxuICAgICAgICAgIFtkZWNrMS5zZXQoZGVjayksIGRlY2tTaXplMS5zZXQoZGVja1NpemUpXSxcbiAgICAgICAgICBbZGVjazAuc2V0KGRlY2spLCBkZWNrU2l6ZTAuc2V0KGRlY2tTaXplKV0sXG4gICAgICAgICksXG4gICAgICAgIGkuaWFkZCgxKSxcbiAgICAgIF0pLFxuICAgICAgcmV0KHJld2FyZC5zdWIoY29zdCkpLFxuICAgIF1cbiAgfSlcblxuICBjb25zdCB0cnlVbmFzc2lnbiA9IGZ1bmMoW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSBsb2NhbChcImkzMlwiKSwgcmVxID0gbG9jYWwoXCJpMzJcIiksIGRlY2sgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IEEgPSBsb2NhbChcImkzMlwiKSwgQiA9IGxvY2FsKFwiaTMyXCIpLCBpID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0c2l6ZSA9IGxvY2FsKFwiaTMyXCIpLCB0b2Zmc2V0ID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBwcmV2aW91c1Njb3JlID0gbG9jYWwoXCJpMzJcIiksIG5leHRTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3Qgc3RlcCA9IGxvY2FsKFNUT1ApXG4gICAgY29uc3Qgc2NoZWRWaWV3ID0ge1xuICAgICAgbW92ZTogKHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPik6IFN0bXRCb2R5ID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUodG9mZnNldC5hZGQodGFyZ2V0KSwgdG9mZnNldC5hZGQoc291cmNlKSwgY291bnQpLFxuICAgICAgYXQ6IChpbmRleDogRXhwcjxcImkzMlwiPikgPT4gc2NoZWR1bGUuYXQodG9mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgIHRyYW4uc2V0KHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUykpLFxuICAgICAgdHNpemUuc2V0KHNjaGVkX3NpemUuYXQodHJhbikpLFxuICAgICAgaWZFbHNlKHRzaXplLmx0KDIpLCByZXQoKSksXG4gICAgICB0b2Zmc2V0LnNldCh0cmFuLm11bChUU0laRSkpLFxuICAgICAgc3RlcC5zZXQoc2NoZWRWaWV3LmF0KHJhbmRpbnQuY2FsbCh0c2l6ZSkpKSxcbiAgICAgIHJlcS5zZXQoc3RlcC5yZXFfaWQpLFxuICAgICAgZGVjay5zZXQoc3RlcC5kZWNrKSxcbiAgICAgIEEuc2V0KC0xKSwgQi5zZXQoLTEpLFxuICAgICAgbG9vcChpLmx0KHRzaXplKSwgW1xuICAgICAgICBzdGVwLnNldChzY2hlZFZpZXcuYXQoaSkpLFxuICAgICAgICBpZkVsc2Uoc3RlcC5yZXFfaWQuZXEocmVxKSwgaWZFbHNlKEEuZXEoLTEpLCBBLnNldChpKSwgQi5zZXQoaSkpKSxcbiAgICAgICAgaS5pYWRkKDEpLFxuICAgICAgXSksXG4gICAgICBpZkVsc2UoQS5lcSgtMSkub3IoQi5lcSgtMSkpLCByZXQoKSksXG4gICAgICBwcmV2aW91c1Njb3JlLnNldChyYXRpbmdzLmF0KHRyYW4pKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEEsIEEuYWRkKDEpLCBCLnN1YihBKS5zdWIoMSkpLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQi5zdWIoMSksIEIuYWRkKDEpLCB0c2l6ZS5zdWIoQikuc3ViKDEpKSxcbiAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KHRzaXplLnN1YigyKSksXG4gICAgICBuZXh0U2NvcmUuc2V0KHJhdGVUcmFuLmNhbGwodHJhbikpLFxuICAgICAgaWZFbHNlKGFjY2VwdEFubmVhbC5jYWxsKHByZXZpb3VzU2NvcmUsIG5leHRTY29yZSwgdGVtcGVyYXR1cmUpLFxuICAgICAgICBbYXNzaWduZWQuYXQocmVxKS5zZXQoMCksIHJhdGluZ3MuYXQodHJhbikuc2V0KG5leHRTY29yZSldLFxuICAgICAgICBbXG4gICAgICAgICAgc2NoZWRWaWV3Lm1vdmUoQi5hZGQoMSksIEIuc3ViKDEpLCB0c2l6ZS5zdWIoQikuc3ViKDEpKSxcbiAgICAgICAgICBzY2hlZFZpZXcubW92ZShBLmFkZCgxKSwgQSwgQi5zdWIoQSkuc3ViKDEpKSxcbiAgICAgICAgICBzY2hlZFZpZXcuYXQoQSkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDEsIGRlY2sgfSksXG4gICAgICAgICAgc2NoZWRWaWV3LmF0KEIpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAwLCBkZWNrIH0pLFxuICAgICAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KHRzaXplKSxcbiAgICAgICAgXSxcbiAgICAgICksXG4gICAgXVxuICB9KVxuXG4gIGNvbnN0IGFkZFJlcXVlc3QgPSBmdW5jKFtcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiXSwgXCJ2b2lkXCIsXG4gICAgKHJlcW4sIHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSkgPT5cbiAgICAgIHJlcXVlc3RzLmF0KHJlcW4pLnNldCh7IHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSB9KSxcbiAgKVxuXG4gIGNvbnN0IGJvb3RzdHJhcCA9IGZ1bmMoW10sIFwidm9pZFwiLCAoKSA9PiB7XG4gICAgY29uc3QgdHJhbiA9IGxvY2FsKFwiaTMyXCIpLCByZXEgPSBsb2NhbChcImkzMlwiKSwgYmVzdFJlcSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3Qgb2Zmc2V0ID0gbG9jYWwoXCJpMzJcIiksIHNjb3JlID0gbG9jYWwoXCJpMzJcIiksIGJlc3RTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgcmV0dXJuIGZvck4ocGxhbm5lci5OVFJBTlMsIHQgPT4gW1xuICAgICAgdHJhbi5zZXQodCksIG9mZnNldC5zZXQodHJhbi5tdWwoVFNJWkUpKSwgYmVzdFJlcS5zZXQoLTEpLCBiZXN0U2NvcmUuc2V0KC1JTkYpLFxuICAgICAgZm9yTihwbGFubmVyLk5SRVFTLCByID0+IFtcbiAgICAgICAgcmVxLnNldChyKSxcbiAgICAgICAgaWZFbHNlKGFzc2lnbmVkLmF0KHJlcSkuZXEoMCksIFtcbiAgICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAxLCBkZWNrOiAwIH0pLFxuICAgICAgICAgIHNjaGVkdWxlLmF0KG9mZnNldC5hZGQoMSkpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAwLCBkZWNrOiAwIH0pLFxuICAgICAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KDIpLFxuICAgICAgICAgIHNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKSxcbiAgICAgICAgICBpZkVsc2Uoc2NvcmUuZ3QoYmVzdFNjb3JlKSwgW2Jlc3RTY29yZS5zZXQoc2NvcmUpLCBiZXN0UmVxLnNldChyZXEpXSksXG4gICAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQoMCksXG4gICAgICAgIF0pLFxuICAgICAgXSksXG4gICAgICBpZkVsc2UoYmVzdFJlcS5ndCgtMSkuYW5kKGJlc3RTY29yZS5ndCgtMTJfMDAxKSksIFtcbiAgICAgICAgc2NoZWR1bGUuYXQob2Zmc2V0KS5zZXQoeyByZXFfaWQ6IGJlc3RSZXEsIGlzX2xvYWQ6IDEsIGRlY2s6IDAgfSksXG4gICAgICAgIHNjaGVkdWxlLmF0KG9mZnNldC5hZGQoMSkpLnNldCh7IHJlcV9pZDogYmVzdFJlcSwgaXNfbG9hZDogMCwgZGVjazogMCB9KSxcbiAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQoMiksXG4gICAgICAgIGFzc2lnbmVkLmF0KGJlc3RSZXEpLnNldCgxKSxcbiAgICAgICAgcmF0aW5ncy5hdCh0cmFuKS5zZXQoYmVzdFNjb3JlKSxcbiAgICAgIF0pLFxuICAgIF0pXG4gIH0pXG5cbiAgY29uc3Qgc2VhcmNoID0gZnVuYyhbXSwgXCJ2b2lkXCIsICgpID0+IHtcbiAgICBjb25zdCB0ZW1wZXJhdHVyZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgcmV0dXJuIFtcbiAgICAgIGRlYnVnKFwiZGVidWdnZXIgb24uXCIsIDApLFxuICAgICAgZm9yTihURU1QX1BIQVNFUywgcGhhc2UgPT4gW1xuICAgICAgICB0ZW1wZXJhdHVyZS5zZXQoaTMyKFNUQVJUX1RFTVBfQ0VOVFMpLnN1YihcbiAgICAgICAgICBwaGFzZS5tdWwoU1RBUlRfVEVNUF9DRU5UUyAtIEVORF9URU1QX0NFTlRTKS5kaXYoVEVNUF9QSEFTRVMgLSAxKSxcbiAgICAgICAgKSksXG4gICAgICAgIGZvck4oU1RFUFNfUEVSX1BIQVNFLCAoKSA9PiBbdHJ5VW5hc3NpZ24uY2FsbCh0ZW1wZXJhdHVyZSksIHRyeUFzc2lnbi5jYWxsKHRlbXBlcmF0dXJlKV0pLFxuICAgICAgXSksXG4gICAgXVxuICB9KVxuICBjb25zdCBnZXRTdG9wID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFNUT1AsXG4gICAgKHRyYW4sIGluZGV4KSA9PiBzY2hlZHVsZS5hdCh0cmFuLm11bChUU0laRSkuYWRkKGluZGV4KSksXG4gIClcblxuICBjb25zdCB3YXNtID0gYXdhaXQgY29tcGlsZSh7XG4gICAgYWRkUmVxdWVzdCxcbiAgICBhc3NpZ25lZCxcbiAgICBib290c3RyYXAsXG4gICAgZGlzdHMsXG4gICAgZ2V0U3RvcCxcbiAgICByYXRlVHJhbixcbiAgICByYXRpbmdzLFxuICAgIHNjaGVkdWxlLFxuICAgIHNlYXJjaCxcbiAgICBzY2hlZF9zaXplLFxuICAgIHRyYW5fcG9zaXRpb25zLFxuICB9KVxuXG4gIHdhc20uZGlzdHMuc2V0KHBsYW5uZXIucm9hZG1hcC5Db3N0TWF0cml4KVxuICB3YXNtLnRyYW5fcG9zaXRpb25zLnNldChwbGFubmVyLnN0YXJ0cG9zaXRpb25zKVxuICBwbGFubmVyLnJlcXVlc3RzLmZvckVhY2goKHJlcXVlc3QsIGkpID0+XG4gICAgd2FzbS5hZGRSZXF1ZXN0KGksIHJlcXVlc3Quc3RhcnRQb2ludCwgcmVxdWVzdC5lbmRQb2ludCwgTWF0aC5yb3VuZChyZXF1ZXN0LnZhbHVlX2V1ciAqIDEwMCksIE1hdGguZmxvb3IocmVxdWVzdC5kZWFkbGluZV9oICogNjApKSxcbiAgKVxuXG4gIHdhc20uYm9vdHN0cmFwKClcblxuICBjb25zdCBzdGFydGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICB3YXNtLnNlYXJjaCgpXG4gIGNvbnN0IGVsYXBzZWRNcyA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRlZEF0XG4gIGNvbnN0IHJlc3VsdFNjaGVkdWxlID0gbmV3IFVpbnQzMkFycmF5KHBsYW5uZXIuTlRSQU5TICogVFNJWkUpXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgcGxhbm5lci5OVFJBTlM7IHRyYW4rKykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2FzbS5zY2hlZF9zaXplW3RyYW5dITsgaSsrKSB7XG4gICAgICBjb25zdCBzdG9wID0gd2FzbS5nZXRTdG9wKHRyYW4sIGkpXG4gICAgICByZXN1bHRTY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSA9IHN0b3AuaXNfbG9hZCB8IHN0b3AuZGVjayA8PCAxIHwgc3RvcC5yZXFfaWQgPDwgMlxuICAgIH1cbiAgfVxuICBjb25zdCB1bmFzc2lnbmVkID0gbmV3IEludDhBcnJheShwbGFubmVyLk5SRVFTKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHVuYXNzaWduZWQubGVuZ3RoOyBpKyspIHVuYXNzaWduZWRbaV0gPSB3YXNtLmFzc2lnbmVkW2ldID8gMCA6IDFcbiAgY29uc3Qgc2NoZWR1bGVSYXRpbmdzID0gbmV3IEludDMyQXJyYXkod2FzbS5yYXRpbmdzKVxuXG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGU6IHJlc3VsdFNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IG5ldyBVaW50MTZBcnJheSh3YXNtLnNjaGVkX3NpemUpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpLFxuICAgIFRTSVpFLFxuICAgIHNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiBzY2hlZHVsZVJhdGluZ3MucmVkdWNlKChzdW0sIHNjb3JlKSA9PiBzdW0gKyBzY29yZSwgMCksXG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgYXJyYXksIGNvbXBpbGUsIGV4cCwgZjMyLCBmdW5jLCBnbG9iYWwsIGkzMiwgaTY0dSwgaWZFbHNlLCBsaXQsIGxvY2FsLCBsb2csIGxvb3AsIHJldCwgc3RydWN0LCB0cmFwLCB0eXBlIEFueUFycmF5LCB0eXBlIEFycmF5SGFuZGxlLCB0eXBlIERUeXBlLCB0eXBlIEV4cHIsIHR5cGUgRXhwckxpa2UsIHR5cGUgU3RtdCwgdHlwZSBTdG10Qm9keSB9IGZyb20gXCIuLi93YXNtXCJcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCJcbmltcG9ydCB7IElORiwgS01fQ09TVF9DRU5UUywgUkVPUkdfQ09TVF9DRU5UUyB9IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIlxuXG5jb25zdCBURU1QX1BIQVNFUyA9IDFfMDAwXG5jb25zdCBFTkRfVEVNUF9DRU5UUyA9IDBcblxuZXhwb3J0IHR5cGUgV2FzbVNlYXJjaFBhcmFtcyA9IHtcbiAgc3RlcHM6IG51bWJlclxuICBzdGFydFRlbXBlcmF0dXJlOiBudW1iZXJcbiAgbnVkZ2VSYWRpdXM6IG51bWJlclxuICBhc3NpZ25XZWlnaHQ6IG51bWJlclxuICB1bmFzc2lnbldlaWdodDogbnVtYmVyXG4gIG51ZGdlV2VpZ2h0OiBudW1iZXJcbiAgcmVsb2NhdGVXZWlnaHQ6IG51bWJlclxuICBybmdTZWVkOiBudW1iZXJcbn1cbmV4cG9ydCBjb25zdCBkZWZhdWx0V2FzbVNlYXJjaFBhcmFtczogV2FzbVNlYXJjaFBhcmFtcyA9IHtcbiAgc3RlcHM6IDFfNjAwXzAwMCwgc3RhcnRUZW1wZXJhdHVyZTogMl81MDAsIG51ZGdlUmFkaXVzOiA0LFxuICBhc3NpZ25XZWlnaHQ6IDMsIHVuYXNzaWduV2VpZ2h0OiAxLCBudWRnZVdlaWdodDogMywgcmVsb2NhdGVXZWlnaHQ6IDMsXG4gIHJuZ1NlZWQ6IDEsXG59XG5cbmNvbnN0IERFQlVHID0gZmFsc2VcblxuZnVuY3Rpb24gZGVidWcgKHRhZzogc3RyaW5nLCB2YWx1ZTogRXhwckxpa2U8XCJpMzJcIj4pe1xuICBpZiAoIURFQlVHKSByZXR1cm4gW11cbiAgcmV0dXJuIFsgbG9nKHRhZywgdmFsdWUpIF1cbn1cblxuZnVuY3Rpb24gY2hlY2tlZEFycmF5PFQgZXh0ZW5kcyBEVHlwZT4odHlwZTogVCwgbGVuZ3RoOiBudW1iZXIpOiBBcnJheUhhbmRsZTxUPiB7XG4gIGNvbnN0IGFyciA9IGFycmF5KHR5cGUsIGxlbmd0aCkgYXMgQW55QXJyYXlcbiAgaWYgKCFERUJVRykgcmV0dXJuIGFyciBhcyBBcnJheUhhbmRsZTxUPlxuXG4gIGNvbnN0IHthdCwgbW92ZX0gPSBhcnJcbiAgY29uc3QgY2hlY2tJZHggPSBmdW5jKFtcImkzMlwiLCBcImkzMlwiXSwgXCJpMzJcIiwgKGksbik9PiBpZkVsc2UoXG4gICAgICBpLmx0KDApLm9yKG4ubHQoMCkpLm9yIChuLmFkZChpKS5ndChhcnIubGVuZ3RoKSksXG4gICAgICB0cmFwKCBcImFycmF5IGJvdW5kcyBleGNlZWRlZFwiKSxcbiAgICAgIHJldChpKVxuICAgIClcbiAgKTtcbiAgYXJyLmF0ID0gaW5kZXggPT4gYXQoY2hlY2tJZHguY2FsbChpbmRleCwgMSkpXG4gIGFyci5tb3ZlID0gKHRhcmdldCwgc291cmNlLCBjb3VudCkgPT4gbW92ZShcbiAgICBjaGVja0lkeC5jYWxsKHRhcmdldCwgY291bnQpLFxuICAgIGNoZWNrSWR4LmNhbGwoc291cmNlLCBjb3VudCksXG4gICAgY291bnQsXG4gIClcbiAgcmV0dXJuIGFyciBhcyBBcnJheUhhbmRsZTxUPlxufVxuXG5mdW5jdGlvbiBmb3JOKG46IG51bWJlciwgYm9keTogKGk6IEV4cHI8XCJpMzJcIj4pID0+IFN0bXRCb2R5KTogU3RtdEJvZHkge1xuICBjb25zdCBpID0gbG9jYWwoXCJpMzJcIilcbiAgcmV0dXJuIFtpLnNldCgwKSwgbG9vcChpLmx0KG4pLCBbYm9keShpKSwgaS5pYWRkKDEpXSldXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhbm5lYWxpbmdXYXNtSW1wcm92ZWQocGxhbm5lcjogTW9kdWxlLCBvcHRpb25zOiBQYXJ0aWFsPFdhc21TZWFyY2hQYXJhbXM+ID0ge30pOiBQcm9taXNlPEFubmVhbGluZ1Jlc3VsdD4ge1xuICBjb25zdCBwYXJhbXMgPSB7IC4uLmRlZmF1bHRXYXNtU2VhcmNoUGFyYW1zLCAuLi5vcHRpb25zIH1cbiAgY29uc3Qgc3RlcHNQZXJQaGFzZSA9IE1hdGguZmxvb3IocGFyYW1zLnN0ZXBzIC8gVEVNUF9QSEFTRVMpXG4gIGNvbnN0IGFzc2lnbkVuZCA9IHBhcmFtcy5hc3NpZ25XZWlnaHRcbiAgY29uc3QgdW5hc3NpZ25FbmQgPSBhc3NpZ25FbmQgKyBwYXJhbXMudW5hc3NpZ25XZWlnaHRcbiAgY29uc3QgbnVkZ2VFbmQgPSB1bmFzc2lnbkVuZCArIHBhcmFtcy5udWRnZVdlaWdodFxuICBjb25zdCB0b3RhbFdlaWdodCA9IG51ZGdlRW5kICsgcGFyYW1zLnJlbG9jYXRlV2VpZ2h0XG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihwbGFubmVyLk5SRVFTIC8gcGxhbm5lci5OVFJBTlMgKiAyLjUgKiAyICsgMTApXG4gIGNvbnN0IE5QT0lOVFMgPSBwbGFubmVyLnJvYWRtYXAucG9pbnRzLmxlbmd0aFxuICBjb25zdCBTVE9QID0gc3RydWN0KHtcbiAgICByZXFfaWQ6IFtcInUxNlwiLCAxMF0sXG4gICAgaXNfbG9hZDogW1widThcIiwgMV0sXG4gICAgZGVjazogW1widThcIiwgMV0sXG4gIH0pXG4gIGNvbnN0IFJFUSA9IHN0cnVjdCh7XG4gICAgc3RhcnQ6IFwidTE2XCIsXG4gICAgZW5kOiBcInUxNlwiLFxuICAgIHZhbHVlOiBcInUxNlwiLFxuICAgIGRlYWRsaW5lOiBcInUxNlwiLFxuICB9KVxuXG4gIGNvbnN0IHJhbmRTdGF0ZSAgICAgID0gZ2xvYmFsKFwiaTMyXCIsIHBhcmFtcy5ybmdTZWVkIHx8IDEpXG4gIGNvbnN0IGRpc3RzICAgICAgICAgID0gY2hlY2tlZEFycmF5KFwiaTMyXCIsIHBsYW5uZXIuUlNJWkUpXG4gIGNvbnN0IHJlcXVlc3RzICAgICAgID0gY2hlY2tlZEFycmF5KFJFUSwgcGxhbm5lci5OUkVRUylcbiAgY29uc3QgYXNzaWduZWQgICAgICAgPSBjaGVja2VkQXJyYXkoXCJ1OFwiLCBwbGFubmVyLk5SRVFTKVxuICBjb25zdCBzY2hlZHVsZSAgICAgICA9IGNoZWNrZWRBcnJheShTVE9QLCBwbGFubmVyLk5UUkFOUyAqIFRTSVpFKVxuICBjb25zdCBzY2hlZF9zaXplICAgICA9IGNoZWNrZWRBcnJheShcImkxNlwiLCBwbGFubmVyLk5UUkFOUylcbiAgY29uc3QgcmF0aW5ncyAgICAgICAgPSBjaGVja2VkQXJyYXkoXCJpMzJcIiwgcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHRyYW5fcG9zaXRpb25zID0gY2hlY2tlZEFycmF5KFwiaTE2XCIsIHBsYW5uZXIuTlRSQU5TKVxuXG4gIGNvbnN0IHJhbmROZXh0ID0gZnVuYyhbXSwgXCJpMzJcIiwgKCkgPT4ge1xuICAgIHJldHVybiBbXG4gICAgICByYW5kU3RhdGUuc2V0KHJhbmRTdGF0ZS54b3IocmFuZFN0YXRlLnNobCgxMykpKSxcbiAgICAgIHJhbmRTdGF0ZS5zZXQocmFuZFN0YXRlLnhvcihyYW5kU3RhdGUuc2hyKDE3KSkpLFxuICAgICAgcmFuZFN0YXRlLnNldChyYW5kU3RhdGUueG9yKHJhbmRTdGF0ZS5zaGwoNSkpKSxcbiAgICAgIHJldChyYW5kU3RhdGUpLFxuICAgIF1cbiAgfSlcbiAgY29uc3QgcmFuZGludCA9IGZ1bmMoW1wiaTMyXCJdLCBcImkzMlwiLCBtYXggPT5cbiAgICBpMzIoaTY0dShyYW5kTmV4dC5jYWxsKCkpLm11bChpNjR1KG1heCkpLnNocigzMm4pKSlcbiAgY29uc3QgYWNjZXB0QW5uZWFsID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChwcmV2aW91cywgbmV4dCwgdGVtcGVyYXR1cmUpID0+IFtcbiAgICBpZkVsc2UocHJldmlvdXMuZ3QobmV4dCksXG4gICAgICByZXQocmFuZGludC5jYWxsKDFfMDAwXzAwMCkubHQoaTMyKGV4cChcbiAgICAgICAgZjMyKG5leHQuc3ViKHByZXZpb3VzKSkuZGl2KGYzMih0ZW1wZXJhdHVyZSkpLFxuICAgICAgKS5tdWwoMV8wMDBfMDAwKSkpKSxcbiAgICAgIHJldCgxKSxcbiAgICApLFxuICBdKVxuXG4gIGNvbnN0IHJvYWRDb3N0ID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChmcm9tLCB0bykgPT4ge1xuICAgIGNvbnN0IGxvID0gbG9jYWwoXCJpMzJcIiksIGluZGV4ID0gbG9jYWwoXCJpMzJcIilcbiAgICByZXR1cm4gW1xuICAgICAgbG8uc2V0KHRvLmFkZChmcm9tLnN1Yih0bykubXVsKGZyb20ubHQodG8pKSkpLFxuICAgICAgaW5kZXguc2V0KGZyb20uYWRkKHRvKS5zdWIobG8pLmFkZChsby5tdWwoTlBPSU5UUykpKSxcbiAgICAgIGluZGV4LnNldChpbmRleC5hZGQoaW5kZXguZ3QocGxhbm5lci5SU0laRSkubXVsKGkzMihOUE9JTlRTICoqIDIpLnN1YihpbmRleC5tdWwoMikpKSkpLFxuICAgICAgcmV0KGRpc3RzLmF0KGluZGV4KSksXG4gICAgXVxuICB9KVxuXG4gIGNvbnN0IHRyeUFzc2lnbiA9IGZ1bmMoW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHJlcV9pZCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQiA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG1wID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0c2l6ZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG9mZnNldCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgcHJldmlvdXNTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgbmV4dFNjb3JlID0gbG9jYWwoXCJpMzJcIilcblxuICAgIGNvbnN0IHNjaGVkVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pOiBTdG10Qm9keSA9PlxuICAgICAgICBzY2hlZHVsZS5tb3ZlKHRvZmZzZXQuYWRkKHRhcmdldCksIHRvZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHRvZmZzZXQuYWRkKGluZGV4KSksXG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHRyYW4uc2V0KHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUykpLFxuICAgICAgcmVxX2lkLnNldChyYW5kaW50LmNhbGwocGxhbm5lci5OUkVRUykpLFxuICAgICAgaWZFbHNlKGFzc2lnbmVkLmF0KHJlcV9pZCkuZXEoMSksIHJldCgpKSxcbiAgICAgIHRvZmZzZXQuc2V0KHRyYW4ubXVsKFRTSVpFKSksXG4gICAgICB0c2l6ZS5zZXQoc2NoZWRfc2l6ZS5hdCh0cmFuKSksXG4gICAgICBpZkVsc2UodHNpemUuZ3QoVFNJWkUgLSAyKSwgcmV0KCkpLFxuICAgICAgcHJldmlvdXNTY29yZS5zZXQocmF0aW5ncy5hdCh0cmFuKSksXG4gICAgICBBLnNldChyYW5kaW50LmNhbGwodHNpemUuYWRkKDEpKSksXG4gICAgICBCLnNldChBLmFkZChyYW5kaW50LmNhbGwoNCkpKSxcbiAgICAgIGlmRWxzZShCLmd0KHRzaXplKSwgQi5zZXQodHNpemUpKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEIuYWRkKDIpLCBCLCB0c2l6ZS5zdWIoQikpLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQS5hZGQoMSksIEEsIEIuc3ViKEEpKSxcbiAgICAgIHRtcC5zZXQocmFuZGludC5jYWxsKDIpKSxcbiAgICAgIHNjaGVkVmlldy5hdChBKS5zZXQoeyByZXFfaWQsIGlzX2xvYWQ6IDEsIGRlY2s6IHRtcCB9KSxcbiAgICAgIHNjaGVkVmlldy5hdChCLmFkZCgxKSkuc2V0KHsgcmVxX2lkLCBpc19sb2FkOiAwLCBkZWNrOiB0bXAgfSksXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZS5hZGQoMikpLFxuICAgICAgbmV4dFNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKSxcbiAgICAgIGlmRWxzZShhY2NlcHRBbm5lYWwuY2FsbChwcmV2aW91c1Njb3JlLCBuZXh0U2NvcmUsIHRlbXBlcmF0dXJlKSxcbiAgICAgICAgW2Fzc2lnbmVkLmF0KHJlcV9pZCkuc2V0KDEpLCByYXRpbmdzLmF0KHRyYW4pLnNldChuZXh0U2NvcmUpXSxcbiAgICAgICAgW1xuICAgICAgICAgIHNjaGVkVmlldy5tb3ZlKEEsIEEuYWRkKDEpLCBCLnN1YihBKSksXG4gICAgICAgICAgc2NoZWRWaWV3Lm1vdmUoQiwgQi5hZGQoMiksIHRzaXplLnN1YihCKSksXG4gICAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQodHNpemUpLFxuICAgICAgICBdLFxuICAgICAgKSxcbiAgICBdXG4gIH0pXG5cbiAgY29uc3QgcmF0ZVRyYW4gPSBmdW5jKFtcImkzMlwiXSwgXCJpMzJcIiwgdHJhbiA9PiB7XG4gICAgY29uc3QgcmV3YXJkID0gbG9jYWwoXCJpMzJcIiksIGNvc3QgPSBsb2NhbChcImkzMlwiKSwgZWxhcHNlZE1pbnV0ZXMgPSBsb2NhbChcImkzMlwiKSwgZGlzdGFuY2UgPSBsb2NhbChcImkzMlwiKSwgcG9zID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBvZmZzZXQgPSBsb2NhbChcImkzMlwiKSwgc2l6ZSA9IGxvY2FsKFwiaTMyXCIpLCBpID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBkZWNrMCA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrMSA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrU2l6ZTAgPSBsb2NhbChcImkzMlwiKSwgZGVja1NpemUxID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBkZWNrID0gbG9jYWwoXCJpMzJcIiksIGRlY2tTaXplID0gbG9jYWwoXCJpMzJcIiksIHJlcSA9IGxvY2FsKFwiaTMyXCIpLCBuZXh0UG9zID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBmb3VuZCA9IGxvY2FsKFwiaTMyXCIpLCBzaGlmdCA9IGxvY2FsKFwiaTMyXCIpLCBsb3dlck1hc2sgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHN0ZXAgPSBsb2NhbChTVE9QKSwgcmVxdWVzdCA9IGxvY2FsKFJFUSlcbiAgICByZXR1cm4gW1xuICAgICAgcG9zLnNldCh0cmFuX3Bvc2l0aW9ucy5hdCh0cmFuKSksXG4gICAgICBvZmZzZXQuc2V0KHRyYW4ubXVsKFRTSVpFKSksXG4gICAgICBzaXplLnNldChzY2hlZF9zaXplLmF0KHRyYW4pKSxcbiAgICAgIGxvb3AoaS5sdChzaXplKSwgW1xuICAgICAgICBzdGVwLnNldChzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGkpKSksXG4gICAgICAgIHJlcS5zZXQoc3RlcC5yZXFfaWQpLFxuICAgICAgICByZXF1ZXN0LnNldChyZXF1ZXN0cy5hdChyZXEpKSxcbiAgICAgICAgbmV4dFBvcy5zZXQoaWZFbHNlKHN0ZXAuaXNfbG9hZCwgcmVxdWVzdC5zdGFydCwgcmVxdWVzdC5lbmQpKSxcbiAgICAgICAgZGlzdGFuY2Uuc2V0KHJvYWRDb3N0LmNhbGwocG9zLCBuZXh0UG9zKSksXG4gICAgICAgIGNvc3QuaWFkZChkaXN0YW5jZS5tdWwoS01fQ09TVF9DRU5UUykpLFxuICAgICAgICBlbGFwc2VkTWludXRlcy5pYWRkKGRpc3RhbmNlKSxcbiAgICAgICAgcG9zLnNldChuZXh0UG9zKSxcbiAgICAgICAgZGVjay5zZXQoaWZFbHNlKHN0ZXAuZGVjaywgZGVjazEsIGRlY2swKSksXG4gICAgICAgIGRlY2tTaXplLnNldChpZkVsc2Uoc3RlcC5kZWNrLCBkZWNrU2l6ZTEsIGRlY2tTaXplMCkpLFxuICAgICAgICBpZkVsc2Uoc3RlcC5pc19sb2FkLCBbXG4gICAgICAgICAgaWZFbHNlKGRlY2tTaXplLmd0KDIpLCByZXQoLUlORikpLFxuICAgICAgICAgIGRlY2suc2V0KGRlY2sub3IocmVxLnNobChkZWNrU2l6ZS5tdWwoMTApKSkpLFxuICAgICAgICAgIGRlY2tTaXplLmlhZGQoMSksXG4gICAgICAgIF0sIFtcbiAgICAgICAgICBmb3VuZC5zZXQoLTEpLFxuICAgICAgICAgIGlmRWxzZShkZWNrU2l6ZS5ndCgwKS5hbmQoZGVjay5hbmQoMTAyMykuZXEocmVxKSksIGZvdW5kLnNldCgwKSksXG4gICAgICAgICAgaWZFbHNlKGZvdW5kLmVxKC0xKS5hbmQoZGVja1NpemUuZ3QoMSkpLmFuZChkZWNrLnNocigxMCkuYW5kKDEwMjMpLmVxKHJlcSkpLCBmb3VuZC5zZXQoMSkpLFxuICAgICAgICAgIGlmRWxzZShmb3VuZC5lcSgtMSkuYW5kKGRlY2tTaXplLmd0KDIpKS5hbmQoZGVjay5zaHIoMjApLmFuZCgxMDIzKS5lcShyZXEpKSwgZm91bmQuc2V0KDIpKSxcbiAgICAgICAgICBpZkVsc2UoZm91bmQuZXEoLTEpLCByZXQoLUlORikpLFxuICAgICAgICAgIGNvc3QuaWFkZChkZWNrU2l6ZS5zdWIoZm91bmQpLnN1YigxKS5tdWwoUkVPUkdfQ09TVF9DRU5UUykpLFxuICAgICAgICAgIHNoaWZ0LnNldChmb3VuZC5tdWwoMTApKSxcbiAgICAgICAgICBsb3dlck1hc2suc2V0KGkzMigxKS5zaGwoc2hpZnQpLnN1YigxKSksXG4gICAgICAgICAgZGVjay5zZXQoZGVjay5hbmQobG93ZXJNYXNrKS5vcihkZWNrLnNocihzaGlmdC5hZGQoMTApKS5zaGwoc2hpZnQpKSksXG4gICAgICAgICAgZGVja1NpemUuaXN1YigxKSxcbiAgICAgICAgICBpZkVsc2UoZWxhcHNlZE1pbnV0ZXMuZ3QocmVxdWVzdC5kZWFkbGluZSksIFtdLCByZXdhcmQuaWFkZChyZXF1ZXN0LnZhbHVlKSksXG4gICAgICAgIF0pLFxuICAgICAgICBpZkVsc2Uoc3RlcC5kZWNrLFxuICAgICAgICAgIFtkZWNrMS5zZXQoZGVjayksIGRlY2tTaXplMS5zZXQoZGVja1NpemUpXSxcbiAgICAgICAgICBbZGVjazAuc2V0KGRlY2spLCBkZWNrU2l6ZTAuc2V0KGRlY2tTaXplKV0sXG4gICAgICAgICksXG4gICAgICAgIGkuaWFkZCgxKSxcbiAgICAgIF0pLFxuICAgICAgcmV0KHJld2FyZC5zdWIoY29zdCkpLFxuICAgIF1cbiAgfSlcblxuICBjb25zdCB0cnlVbmFzc2lnbiA9IGZ1bmMoW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSBsb2NhbChcImkzMlwiKSwgcmVxID0gbG9jYWwoXCJpMzJcIiksIGRlY2sgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IEEgPSBsb2NhbChcImkzMlwiKSwgQiA9IGxvY2FsKFwiaTMyXCIpLCBpID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0c2l6ZSA9IGxvY2FsKFwiaTMyXCIpLCB0b2Zmc2V0ID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBwcmV2aW91c1Njb3JlID0gbG9jYWwoXCJpMzJcIiksIG5leHRTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3Qgc3RlcCA9IGxvY2FsKFNUT1ApXG4gICAgY29uc3Qgc2NoZWRWaWV3ID0ge1xuICAgICAgbW92ZTogKHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPik6IFN0bXRCb2R5ID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUodG9mZnNldC5hZGQodGFyZ2V0KSwgdG9mZnNldC5hZGQoc291cmNlKSwgY291bnQpLFxuICAgICAgYXQ6IChpbmRleDogRXhwcjxcImkzMlwiPikgPT4gc2NoZWR1bGUuYXQodG9mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgIHRyYW4uc2V0KHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUykpLFxuICAgICAgdHNpemUuc2V0KHNjaGVkX3NpemUuYXQodHJhbikpLFxuICAgICAgaWZFbHNlKHRzaXplLmx0KDIpLCByZXQoKSksXG4gICAgICB0b2Zmc2V0LnNldCh0cmFuLm11bChUU0laRSkpLFxuICAgICAgc3RlcC5zZXQoc2NoZWRWaWV3LmF0KHJhbmRpbnQuY2FsbCh0c2l6ZSkpKSxcbiAgICAgIHJlcS5zZXQoc3RlcC5yZXFfaWQpLFxuICAgICAgZGVjay5zZXQoc3RlcC5kZWNrKSxcbiAgICAgIEEuc2V0KC0xKSwgQi5zZXQoLTEpLFxuICAgICAgbG9vcChpLmx0KHRzaXplKSwgW1xuICAgICAgICBzdGVwLnNldChzY2hlZFZpZXcuYXQoaSkpLFxuICAgICAgICBpZkVsc2Uoc3RlcC5yZXFfaWQuZXEocmVxKSwgaWZFbHNlKEEuZXEoLTEpLCBBLnNldChpKSwgQi5zZXQoaSkpKSxcbiAgICAgICAgaS5pYWRkKDEpLFxuICAgICAgXSksXG4gICAgICBpZkVsc2UoQS5lcSgtMSkub3IoQi5lcSgtMSkpLCByZXQoKSksXG4gICAgICBwcmV2aW91c1Njb3JlLnNldChyYXRpbmdzLmF0KHRyYW4pKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEEsIEEuYWRkKDEpLCBCLnN1YihBKS5zdWIoMSkpLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQi5zdWIoMSksIEIuYWRkKDEpLCB0c2l6ZS5zdWIoQikuc3ViKDEpKSxcbiAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KHRzaXplLnN1YigyKSksXG4gICAgICBuZXh0U2NvcmUuc2V0KHJhdGVUcmFuLmNhbGwodHJhbikpLFxuICAgICAgaWZFbHNlKGFjY2VwdEFubmVhbC5jYWxsKHByZXZpb3VzU2NvcmUsIG5leHRTY29yZSwgdGVtcGVyYXR1cmUpLFxuICAgICAgICBbYXNzaWduZWQuYXQocmVxKS5zZXQoMCksIHJhdGluZ3MuYXQodHJhbikuc2V0KG5leHRTY29yZSldLFxuICAgICAgICBbXG4gICAgICAgICAgc2NoZWRWaWV3Lm1vdmUoQi5hZGQoMSksIEIuc3ViKDEpLCB0c2l6ZS5zdWIoQikuc3ViKDEpKSxcbiAgICAgICAgICBzY2hlZFZpZXcubW92ZShBLmFkZCgxKSwgQSwgQi5zdWIoQSkuc3ViKDEpKSxcbiAgICAgICAgICBzY2hlZFZpZXcuYXQoQSkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDEsIGRlY2sgfSksXG4gICAgICAgICAgc2NoZWRWaWV3LmF0KEIpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAwLCBkZWNrIH0pLFxuICAgICAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KHRzaXplKSxcbiAgICAgICAgXSxcbiAgICAgICksXG4gICAgXVxuICB9KVxuXG4gIGNvbnN0IHRyeVJlbG9jYXRlID0gZnVuYyhbXCJpMzJcIl0sIFwidm9pZFwiLCB0ZW1wZXJhdHVyZSA9PiB7XG4gICAgY29uc3Qgc3JjID0gbG9jYWwoXCJpMzJcIiksIGRzdCA9IGxvY2FsKFwiaTMyXCIpLCByZXEgPSBsb2NhbChcImkzMlwiKSwgZGVjayA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQSA9IGxvY2FsKFwiaTMyXCIpLCBCID0gbG9jYWwoXCJpMzJcIiksIEMgPSBsb2NhbChcImkzMlwiKSwgRCA9IGxvY2FsKFwiaTMyXCIpLCBpID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBzcmNTaXplID0gbG9jYWwoXCJpMzJcIiksIGRzdFNpemUgPSBsb2NhbChcImkzMlwiKSwgc3JjT2Zmc2V0ID0gbG9jYWwoXCJpMzJcIiksIGRzdE9mZnNldCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgcHJldmlvdXNTY29yZSA9IGxvY2FsKFwiaTMyXCIpLCBuZXh0U3JjID0gbG9jYWwoXCJpMzJcIiksIG5leHREc3QgPSBsb2NhbChcImkzMlwiKSwgc3RlcCA9IGxvY2FsKFNUT1ApXG4gICAgY29uc3Qgc3JjVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pOiBTdG10Qm9keSA9PlxuICAgICAgICBzY2hlZHVsZS5tb3ZlKHNyY09mZnNldC5hZGQodGFyZ2V0KSwgc3JjT2Zmc2V0LmFkZChzb3VyY2UpLCBjb3VudCksXG4gICAgICBhdDogKGluZGV4OiBFeHByPFwiaTMyXCI+KSA9PiBzY2hlZHVsZS5hdChzcmNPZmZzZXQuYWRkKGluZGV4KSksXG4gICAgfVxuICAgIGNvbnN0IGRzdFZpZXcgPSB7XG4gICAgICBtb3ZlOiAodGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+KTogU3RtdEJvZHkgPT5cbiAgICAgICAgc2NoZWR1bGUubW92ZShkc3RPZmZzZXQuYWRkKHRhcmdldCksIGRzdE9mZnNldC5hZGQoc291cmNlKSwgY291bnQpLFxuICAgICAgYXQ6IChpbmRleDogRXhwcjxcImkzMlwiPikgPT4gc2NoZWR1bGUuYXQoZHN0T2Zmc2V0LmFkZChpbmRleCkpLFxuICAgIH1cbiAgICByZXR1cm4gW1xuICAgICAgc3JjLnNldChyYW5kaW50LmNhbGwocGxhbm5lci5OVFJBTlMpKSwgZHN0LnNldChyYW5kaW50LmNhbGwocGxhbm5lci5OVFJBTlMpKSxcbiAgICAgIGlmRWxzZShzcmMuZXEoZHN0KSwgcmV0KCkpLFxuICAgICAgc3JjU2l6ZS5zZXQoc2NoZWRfc2l6ZS5hdChzcmMpKSwgZHN0U2l6ZS5zZXQoc2NoZWRfc2l6ZS5hdChkc3QpKSxcbiAgICAgIGlmRWxzZShzcmNTaXplLmx0KDIpLm9yKGRzdFNpemUuZ3QoVFNJWkUgLSAyKSksIHJldCgpKSxcbiAgICAgIHNyY09mZnNldC5zZXQoc3JjLm11bChUU0laRSkpLCBkc3RPZmZzZXQuc2V0KGRzdC5tdWwoVFNJWkUpKSxcbiAgICAgIHN0ZXAuc2V0KHNyY1ZpZXcuYXQocmFuZGludC5jYWxsKHNyY1NpemUpKSksIHJlcS5zZXQoc3RlcC5yZXFfaWQpLCBkZWNrLnNldChzdGVwLmRlY2spLFxuICAgICAgQS5zZXQoLTEpLCBCLnNldCgtMSksXG4gICAgICBsb29wKGkubHQoc3JjU2l6ZSksIFtcbiAgICAgICAgc3RlcC5zZXQoc3JjVmlldy5hdChpKSksXG4gICAgICAgIGlmRWxzZShzdGVwLnJlcV9pZC5lcShyZXEpLCBpZkVsc2UoQS5lcSgtMSksIEEuc2V0KGkpLCBCLnNldChpKSkpLFxuICAgICAgICBpLmlhZGQoMSksXG4gICAgICBdKSxcbiAgICAgIGlmRWxzZShBLmVxKC0xKS5vcihCLmVxKC0xKSksIHJldCgpKSxcbiAgICAgIHByZXZpb3VzU2NvcmUuc2V0KHJhdGluZ3MuYXQoc3JjKS5hZGQocmF0aW5ncy5hdChkc3QpKSksXG4gICAgICBzcmNWaWV3Lm1vdmUoQSwgQS5hZGQoMSksIEIuc3ViKEEpLnN1YigxKSksXG4gICAgICBzcmNWaWV3Lm1vdmUoQi5zdWIoMSksIEIuYWRkKDEpLCBzcmNTaXplLnN1YihCKS5zdWIoMSkpLFxuICAgICAgc2NoZWRfc2l6ZS5hdChzcmMpLnNldChzcmNTaXplLnN1YigyKSksXG4gICAgICBDLnNldChyYW5kaW50LmNhbGwoZHN0U2l6ZS5hZGQoMSkpKSwgRC5zZXQoQy5hZGQocmFuZGludC5jYWxsKDQpKSksXG4gICAgICBpZkVsc2UoRC5ndChkc3RTaXplKSwgRC5zZXQoZHN0U2l6ZSkpLFxuICAgICAgZHN0Vmlldy5tb3ZlKEQuYWRkKDIpLCBELCBkc3RTaXplLnN1YihEKSksXG4gICAgICBkc3RWaWV3Lm1vdmUoQy5hZGQoMSksIEMsIEQuc3ViKEMpKSxcbiAgICAgIGRzdFZpZXcuYXQoQykuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDEsIGRlY2sgfSksXG4gICAgICBkc3RWaWV3LmF0KEQuYWRkKDEpKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMCwgZGVjayB9KSxcbiAgICAgIHNjaGVkX3NpemUuYXQoZHN0KS5zZXQoZHN0U2l6ZS5hZGQoMikpLFxuICAgICAgbmV4dFNyYy5zZXQocmF0ZVRyYW4uY2FsbChzcmMpKSwgbmV4dERzdC5zZXQocmF0ZVRyYW4uY2FsbChkc3QpKSxcbiAgICAgIGlmRWxzZShhY2NlcHRBbm5lYWwuY2FsbChwcmV2aW91c1Njb3JlLCBuZXh0U3JjLmFkZChuZXh0RHN0KSwgdGVtcGVyYXR1cmUpLFxuICAgICAgICBbcmF0aW5ncy5hdChzcmMpLnNldChuZXh0U3JjKSwgcmF0aW5ncy5hdChkc3QpLnNldChuZXh0RHN0KV0sXG4gICAgICAgIFtcbiAgICAgICAgICBkc3RWaWV3Lm1vdmUoQywgQy5hZGQoMSksIEQuc3ViKEMpKSxcbiAgICAgICAgICBkc3RWaWV3Lm1vdmUoRCwgRC5hZGQoMiksIGRzdFNpemUuc3ViKEQpKSxcbiAgICAgICAgICBzY2hlZF9zaXplLmF0KGRzdCkuc2V0KGRzdFNpemUpLFxuICAgICAgICAgIHNyY1ZpZXcubW92ZShCLmFkZCgxKSwgQi5zdWIoMSksIHNyY1NpemUuc3ViKEIpLnN1YigxKSksXG4gICAgICAgICAgc3JjVmlldy5tb3ZlKEEuYWRkKDEpLCBBLCBCLnN1YihBKS5zdWIoMSkpLFxuICAgICAgICAgIHNyY1ZpZXcuYXQoQSkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDEsIGRlY2sgfSksXG4gICAgICAgICAgc3JjVmlldy5hdChCKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMCwgZGVjayB9KSxcbiAgICAgICAgICBzY2hlZF9zaXplLmF0KHNyYykuc2V0KHNyY1NpemUpLFxuICAgICAgICBdLFxuICAgICAgKSxcbiAgICBdXG4gIH0pXG5cbiAgY29uc3QgdHJ5TnVkZ2VTdG9wID0gZnVuYyhbXCJpMzJcIl0sIFwidm9pZFwiLCB0ZW1wZXJhdHVyZSA9PiB7XG4gICAgY29uc3QgdHJhbiA9IGxvY2FsKFwiaTMyXCIpLCBzaXplID0gbG9jYWwoXCJpMzJcIiksIG9mZnNldCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgZnJvbSA9IGxvY2FsKFwiaTMyXCIpLCB0YXJnZXQgPSBsb2NhbChcImkzMlwiKSwgcm9sbCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgZmlyc3QgPSBsb2NhbChcImkzMlwiKSwgZW5kID0gbG9jYWwoXCJpMzJcIiksIGkgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHByZXZpb3VzU2NvcmUgPSBsb2NhbChcImkzMlwiKSwgbmV4dFNjb3JlID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBzZWxlY3RlZCA9IGxvY2FsKFNUT1ApLCBjcm9zc2VkID0gbG9jYWwoU1RPUClcbiAgICByZXR1cm4gW1xuICAgICAgdHJhbi5zZXQocmFuZGludC5jYWxsKHBsYW5uZXIuTlRSQU5TKSksIHNpemUuc2V0KHNjaGVkX3NpemUuYXQodHJhbikpLFxuICAgICAgaWZFbHNlKHNpemUubHQoMiksIHJldCgpKSxcbiAgICAgIG9mZnNldC5zZXQodHJhbi5tdWwoVFNJWkUpKSwgZnJvbS5zZXQocmFuZGludC5jYWxsKHNpemUpKSxcbiAgICAgIHNlbGVjdGVkLnNldChzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGZyb20pKSksXG4gICAgICByb2xsLnNldChyYW5kaW50LmNhbGwocGFyYW1zLm51ZGdlUmFkaXVzICogMikpLFxuICAgICAgdGFyZ2V0LnNldChmcm9tLmFkZChpZkVsc2Uocm9sbC5sdChwYXJhbXMubnVkZ2VSYWRpdXMpLCByb2xsLnN1YihwYXJhbXMubnVkZ2VSYWRpdXMpLCByb2xsLnN1YihwYXJhbXMubnVkZ2VSYWRpdXMgLSAxKSkpKSxcbiAgICAgIGlmRWxzZSh0YXJnZXQubHQoMCksIHRhcmdldC5zZXQoMCkpLFxuICAgICAgaWZFbHNlKHRhcmdldC5ndChzaXplLnN1YigxKSksIHRhcmdldC5zZXQoc2l6ZS5zdWIoMSkpKSxcbiAgICAgIGlmRWxzZSh0YXJnZXQuZXEoZnJvbSksIHJldCgpKSxcbiAgICAgIGlmRWxzZSh0YXJnZXQubHQoZnJvbSksIFtmaXJzdC5zZXQodGFyZ2V0KSwgZW5kLnNldChmcm9tKV0sIFtmaXJzdC5zZXQoZnJvbS5hZGQoMSkpLCBlbmQuc2V0KHRhcmdldC5hZGQoMSkpXSksXG4gICAgICBpLnNldChmaXJzdCksXG4gICAgICBsb29wKGkubHQoZW5kKSwgW1xuICAgICAgICBjcm9zc2VkLnNldChzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGkpKSksXG4gICAgICAgIGlmRWxzZShjcm9zc2VkLnJlcV9pZC5lcShzZWxlY3RlZC5yZXFfaWQpLCByZXQoKSksXG4gICAgICAgIGkuaWFkZCgxKSxcbiAgICAgIF0pLFxuICAgICAgcHJldmlvdXNTY29yZS5zZXQocmF0aW5ncy5hdCh0cmFuKSksXG4gICAgICBpZkVsc2UodGFyZ2V0Lmx0KGZyb20pLFxuICAgICAgICBzY2hlZHVsZS5tb3ZlKG9mZnNldC5hZGQodGFyZ2V0LmFkZCgxKSksIG9mZnNldC5hZGQodGFyZ2V0KSwgZnJvbS5zdWIodGFyZ2V0KSksXG4gICAgICAgIHNjaGVkdWxlLm1vdmUob2Zmc2V0LmFkZChmcm9tKSwgb2Zmc2V0LmFkZChmcm9tLmFkZCgxKSksIHRhcmdldC5zdWIoZnJvbSkpLFxuICAgICAgKSxcbiAgICAgIHNjaGVkdWxlLmF0KG9mZnNldC5hZGQodGFyZ2V0KSkuc2V0KHNlbGVjdGVkKSxcbiAgICAgIG5leHRTY29yZS5zZXQocmF0ZVRyYW4uY2FsbCh0cmFuKSksXG4gICAgICBpZkVsc2UoYWNjZXB0QW5uZWFsLmNhbGwocHJldmlvdXNTY29yZSwgbmV4dFNjb3JlLCB0ZW1wZXJhdHVyZSksXG4gICAgICAgIHJhdGluZ3MuYXQodHJhbikuc2V0KG5leHRTY29yZSksXG4gICAgICAgIFtcbiAgICAgICAgICBpZkVsc2UodGFyZ2V0Lmx0KGZyb20pLFxuICAgICAgICAgICAgc2NoZWR1bGUubW92ZShvZmZzZXQuYWRkKHRhcmdldCksIG9mZnNldC5hZGQodGFyZ2V0LmFkZCgxKSksIGZyb20uc3ViKHRhcmdldCkpLFxuICAgICAgICAgICAgc2NoZWR1bGUubW92ZShvZmZzZXQuYWRkKGZyb20uYWRkKDEpKSwgb2Zmc2V0LmFkZChmcm9tKSwgdGFyZ2V0LnN1Yihmcm9tKSksXG4gICAgICAgICAgKSxcbiAgICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGZyb20pKS5zZXQoc2VsZWN0ZWQpLFxuICAgICAgICBdLFxuICAgICAgKSxcbiAgICBdXG4gIH0pXG5cbiAgY29uc3QgYWRkUmVxdWVzdCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLCBcInZvaWRcIixcbiAgICAocmVxbiwgc3RhcnQsIGVuZCwgdmFsdWUsIGRlYWRsaW5lKSA9PlxuICAgICAgcmVxdWVzdHMuYXQocmVxbikuc2V0KHsgc3RhcnQsIGVuZCwgdmFsdWUsIGRlYWRsaW5lIH0pLFxuICApXG5cbiAgY29uc3QgYm9vdHN0cmFwID0gZnVuYyhbXSwgXCJ2b2lkXCIsICgpID0+IHtcbiAgICBjb25zdCB0cmFuID0gbG9jYWwoXCJpMzJcIiksIHJlcSA9IGxvY2FsKFwiaTMyXCIpLCBiZXN0UmVxID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBvZmZzZXQgPSBsb2NhbChcImkzMlwiKSwgc2NvcmUgPSBsb2NhbChcImkzMlwiKSwgYmVzdFNjb3JlID0gbG9jYWwoXCJpMzJcIilcbiAgICByZXR1cm4gZm9yTihwbGFubmVyLk5UUkFOUywgdCA9PiBbXG4gICAgICB0cmFuLnNldCh0KSwgb2Zmc2V0LnNldCh0cmFuLm11bChUU0laRSkpLCBiZXN0UmVxLnNldCgtMSksIGJlc3RTY29yZS5zZXQoLUlORiksXG4gICAgICBmb3JOKHBsYW5uZXIuTlJFUVMsIHIgPT4gW1xuICAgICAgICByZXEuc2V0KHIpLFxuICAgICAgICBpZkVsc2UoYXNzaWduZWQuYXQocmVxKS5lcSgwKSwgW1xuICAgICAgICAgIHNjaGVkdWxlLmF0KG9mZnNldCkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDEsIGRlY2s6IDAgfSksXG4gICAgICAgICAgc2NoZWR1bGUuYXQob2Zmc2V0LmFkZCgxKSkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDAsIGRlY2s6IDAgfSksXG4gICAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQoMiksXG4gICAgICAgICAgc2NvcmUuc2V0KHJhdGVUcmFuLmNhbGwodHJhbikpLFxuICAgICAgICAgIGlmRWxzZShzY29yZS5ndChiZXN0U2NvcmUpLCBbYmVzdFNjb3JlLnNldChzY29yZSksIGJlc3RSZXEuc2V0KHJlcSldKSxcbiAgICAgICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCgwKSxcbiAgICAgICAgXSksXG4gICAgICBdKSxcbiAgICAgIGlmRWxzZShiZXN0UmVxLmd0KC0xKS5hbmQoYmVzdFNjb3JlLmd0KC0xMl8wMDEpKSwgW1xuICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQpLnNldCh7IHJlcV9pZDogYmVzdFJlcSwgaXNfbG9hZDogMSwgZGVjazogMCB9KSxcbiAgICAgICAgc2NoZWR1bGUuYXQob2Zmc2V0LmFkZCgxKSkuc2V0KHsgcmVxX2lkOiBiZXN0UmVxLCBpc19sb2FkOiAwLCBkZWNrOiAwIH0pLFxuICAgICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCgyKSxcbiAgICAgICAgYXNzaWduZWQuYXQoYmVzdFJlcSkuc2V0KDEpLFxuICAgICAgICByYXRpbmdzLmF0KHRyYW4pLnNldChiZXN0U2NvcmUpLFxuICAgICAgXSksXG4gICAgXSlcbiAgfSlcblxuICBjb25zdCBzZWFyY2ggPSBmdW5jKFtdLCBcInZvaWRcIiwgKCkgPT4ge1xuICAgIGNvbnN0IHRlbXBlcmF0dXJlID0gbG9jYWwoXCJpMzJcIiksIG1vdmUgPSBsb2NhbChcImkzMlwiKVxuICAgIHJldHVybiBbXG4gICAgICBkZWJ1ZyhcImRlYnVnZ2VyIG9uLlwiLCAwKSxcbiAgICAgIGZvck4oVEVNUF9QSEFTRVMsIHBoYXNlID0+IFtcbiAgICAgICAgdGVtcGVyYXR1cmUuc2V0KGkzMihwYXJhbXMuc3RhcnRUZW1wZXJhdHVyZSkuc3ViKFxuICAgICAgICAgIHBoYXNlLm11bChwYXJhbXMuc3RhcnRUZW1wZXJhdHVyZSAtIEVORF9URU1QX0NFTlRTKS5kaXYoVEVNUF9QSEFTRVMgLSAxKSxcbiAgICAgICAgKSksXG4gICAgICAgIGZvck4oc3RlcHNQZXJQaGFzZSwgKCkgPT4gW1xuICAgICAgICAgIG1vdmUuc2V0KHJhbmRpbnQuY2FsbCh0b3RhbFdlaWdodCkpLFxuICAgICAgICAgIGlmRWxzZShtb3ZlLmx0KGFzc2lnbkVuZCksIHRyeUFzc2lnbi5jYWxsKHRlbXBlcmF0dXJlKSxcbiAgICAgICAgICAgIGlmRWxzZShtb3ZlLmx0KHVuYXNzaWduRW5kKSwgdHJ5VW5hc3NpZ24uY2FsbCh0ZW1wZXJhdHVyZSksXG4gICAgICAgICAgICAgIGlmRWxzZShtb3ZlLmx0KG51ZGdlRW5kKSwgdHJ5TnVkZ2VTdG9wLmNhbGwodGVtcGVyYXR1cmUpLCB0cnlSZWxvY2F0ZS5jYWxsKHRlbXBlcmF0dXJlKSkpKSxcbiAgICAgICAgXSksXG4gICAgICBdKSxcbiAgICBdXG4gIH0pXG4gIGNvbnN0IGdldFN0b3AgPSBmdW5jKFtcImkzMlwiLCBcImkzMlwiXSwgU1RPUCxcbiAgICAodHJhbiwgaW5kZXgpID0+IHNjaGVkdWxlLmF0KHRyYW4ubXVsKFRTSVpFKS5hZGQoaW5kZXgpKSxcbiAgKVxuXG4gIGNvbnN0IHdhc20gPSBhd2FpdCBjb21waWxlKHtcbiAgICBhZGRSZXF1ZXN0LFxuICAgIGFzc2lnbmVkLFxuICAgIGJvb3RzdHJhcCxcbiAgICBkaXN0cyxcbiAgICBnZXRTdG9wLFxuICAgIHJhdGVUcmFuLFxuICAgIHJhdGluZ3MsXG4gICAgc2NoZWR1bGUsXG4gICAgc2VhcmNoLFxuICAgIHNjaGVkX3NpemUsXG4gICAgdHJhbl9wb3NpdGlvbnMsXG4gIH0pXG5cbiAgd2FzbS5kaXN0cy5zZXQocGxhbm5lci5yb2FkbWFwLkNvc3RNYXRyaXgpXG4gIHdhc20udHJhbl9wb3NpdGlvbnMuc2V0KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpXG4gIHBsYW5uZXIucmVxdWVzdHMuZm9yRWFjaCgocmVxdWVzdCwgaSkgPT5cbiAgICB3YXNtLmFkZFJlcXVlc3QoaSwgcmVxdWVzdC5zdGFydFBvaW50LCByZXF1ZXN0LmVuZFBvaW50LCBNYXRoLnJvdW5kKHJlcXVlc3QudmFsdWVfZXVyICogMTAwKSwgTWF0aC5mbG9vcihyZXF1ZXN0LmRlYWRsaW5lX2ggKiA2MCkpLFxuICApXG5cbiAgd2FzbS5ib290c3RyYXAoKVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gIHdhc20uc2VhcmNoKClcbiAgY29uc3QgZWxhcHNlZE1zID0gcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydGVkQXRcbiAgY29uc3QgcmVzdWx0U2NoZWR1bGUgPSBuZXcgVWludDMyQXJyYXkocGxhbm5lci5OVFJBTlMgKiBUU0laRSlcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBwbGFubmVyLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3YXNtLnNjaGVkX3NpemVbdHJhbl0hOyBpKyspIHtcbiAgICAgIGNvbnN0IHN0b3AgPSB3YXNtLmdldFN0b3AodHJhbiwgaSlcbiAgICAgIHJlc3VsdFNjaGVkdWxlW3RyYW4gKiBUU0laRSArIGldID0gc3RvcC5pc19sb2FkIHwgc3RvcC5kZWNrIDw8IDEgfCBzdG9wLnJlcV9pZCA8PCAyXG4gICAgfVxuICB9XG4gIGNvbnN0IHVuYXNzaWduZWQgPSBuZXcgSW50OEFycmF5KHBsYW5uZXIuTlJFUVMpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdW5hc3NpZ25lZC5sZW5ndGg7IGkrKykgdW5hc3NpZ25lZFtpXSA9IHdhc20uYXNzaWduZWRbaV0gPyAwIDogMVxuICBjb25zdCBzY2hlZHVsZVJhdGluZ3MgPSBuZXcgSW50MzJBcnJheSh3YXNtLnJhdGluZ3MpXG5cbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZTogcmVzdWx0U2NoZWR1bGUsXG4gICAgc2NoZWR1bGVTaXplczogbmV3IFVpbnQxNkFycmF5KHdhc20uc2NoZWRfc2l6ZSksXG4gICAgdHJhblN0YXJ0OiBuZXcgVWludDE2QXJyYXkocGxhbm5lci5zdGFydHBvc2l0aW9ucyksXG4gICAgVFNJWkUsXG4gICAgc2NoZWR1bGVSYXRpbmdzLFxuICAgIHVuYXNzaWduZWQsXG4gICAgZWxhcHNlZE1zLFxuICAgIHRvdGFsU2NvcmU6IHNjaGVkdWxlUmF0aW5ncy5yZWR1Y2UoKHN1bSwgc2NvcmUpID0+IHN1bSArIHNjb3JlLCAwKSxcbiAgfVxufVxuIiwKICAgICJpbXBvcnQgeyBidXR0b24sIGNvbG9yLCBkaXYsIHAsIHBvcHVwLCBzcGFuLCBzdHlsZSwgdGFibGUsIHRkLCB0aCwgdHIgfSBmcm9tIFwiLi4vdmlldy9odG1sXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMgfSBmcm9tIFwiLi4vdmlldy9tYWluXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZywgdHlwZSBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi9hbm5lYWxpbmdfYmFzZWxpbmVcIjtcbmltcG9ydCB7IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiwgaW1wcm92ZWRBbm5lYWxpbmcsIHR5cGUgSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIH0gZnJvbSBcIi4vYW5uZWFsaW5nX2ltcHJvdmVkXCI7XG5pbXBvcnQgeyBhbm5lYWxpbmdXYXNtIH0gZnJvbSBcIi4vYW5uZWFsaW5nX3dhc21cIjtcbmltcG9ydCB7IGFubmVhbGluZ1dhc21JbXByb3ZlZCB9IGZyb20gXCIuL2FubmVhbGluZ193YXNtX2ltcHJvdmVkXCI7XG5pbXBvcnQgeyBBVkdfU1BFRURfS01ILCBnZXREZWNrLCBnZXRSZXEsIGluaXRBbm5lYWxpbmdTdGF0ZSwgaXNMb2FkLCBLTV9DT1NUX0NFTlRTLCBSRU9SR19DT1NUX0NFTlRTLCBzY29yZVJvdXRlIH0gZnJvbSBcIi4vYW5uZWFsaW5nX3NoYXJlZFwiO1xuXG5leHBvcnQgY29uc3QgYXZhaWxhYmxlU29sdmVycyA9IHtcbiAgYmFzZWxpbmU6IGJhc2VsaW5lQW5uZWFsaW5nLFxuICBpbXByb3ZlZDogaW1wcm92ZWRBbm5lYWxpbmcsXG4gIHdhc206IGFubmVhbGluZ1dhc20sXG4gIHdhc21JbXByb3ZlZDogYW5uZWFsaW5nV2FzbUltcHJvdmVkLFxufSBhcyBjb25zdDtcbnR5cGUgU29sdmVyTmFtZSA9IGtleW9mIHR5cGVvZiBhdmFpbGFibGVTb2x2ZXJzO1xuXG5jb25zdCBJTklUSUFMX1NPTFZFUjogU29sdmVyTmFtZSA9IFwid2FzbUltcHJvdmVkXCI7XG5jb25zdCBldXJvcyA9IChjZW50czogbnVtYmVyKSA9PiBgJHsoY2VudHMgLyAxMDApLnRvRml4ZWQoMil94oKsYDtcblxuY2xhc3MgU2NvcmVNaXNtYXRjaEVycm9yIGV4dGVuZHMgRXJyb3Ige31cblxuZnVuY3Rpb24gY2Fub25pY2FsU2NoZWR1bGUobW9kOiBNb2R1bGUsIHJlc3VsdDogQW5uZWFsaW5nUmVzdWx0KSB7XG4gIGNvbnN0IHNjaGVkdWxlID0gbmV3IFVpbnQzMkFycmF5KHJlc3VsdC5zY2hlZHVsZSlcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBtb2QuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBzaXplID0gcmVzdWx0LnNjaGVkdWxlU2l6ZXNbdHJhbl0hXG4gICAgaWYgKHNpemUgPCAwIHx8IHNpemUgPiByZXN1bHQuVFNJWkUpIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRyYW5zcG9ydGVyICR7dHJhbn0gaGFzIGludmFsaWQgc2NoZWR1bGUgc2l6ZSAke3NpemV9YClcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgY29uc3QgYXQgPSB0cmFuICogcmVzdWx0LlRTSVpFICsgaVxuICAgICAgY29uc3Qgc3RlcCA9IHNjaGVkdWxlW2F0XVxuICAgICAgaWYgKHN0ZXAgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IFNjb3JlTWlzbWF0Y2hFcnJvcihgVHJhbnNwb3J0ZXIgJHt0cmFufSBzY2hlZHVsZSBpcyB0cnVuY2F0ZWQgYXQgJHtpfWApXG4gICAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RlcCksIHJlcXVlc3QgPSBtb2QucmVxdWVzdHNbcmVxXVxuICAgICAgaWYgKCFyZXF1ZXN0KSB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKGBUcmFuc3BvcnRlciAke3RyYW59IHJlZmVyZW5jZXMgdW5rbm93biByZXF1ZXN0ICR7cmVxfWApXG4gICAgICBjb25zdCBwb3MgPSBpc0xvYWQoc3RlcCkgPyByZXF1ZXN0LnN0YXJ0UG9pbnQgOiByZXF1ZXN0LmVuZFBvaW50XG4gICAgICBzY2hlZHVsZVthdF0gPSAoc3RlcCAmIDB4ZmZmZikgfCBwb3MgPDwgMTZcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNjaGVkdWxlXG59XG5cbmZ1bmN0aW9uIGNoZWNrZWRSZXN1bHQobW9kOiBNb2R1bGUsIHJlc3VsdDogQW5uZWFsaW5nUmVzdWx0KSB7XG4gIGlmIChyZXN1bHQuc2NoZWR1bGVTaXplcy5sZW5ndGggIT09IG1vZC5OVFJBTlMgfHwgcmVzdWx0LnNjaGVkdWxlUmF0aW5ncy5sZW5ndGggIT09IG1vZC5OVFJBTlMpXG4gICAgdGhyb3cgbmV3IFNjb3JlTWlzbWF0Y2hFcnJvcihcIlNvbHZlciByZXR1cm5lZCBpbmNvcnJlY3RseSBzaXplZCB0cmFuc3BvcnRlciBhcnJheXNcIilcbiAgY29uc3Qgc2NoZWR1bGUgPSBjYW5vbmljYWxTY2hlZHVsZShtb2QsIHJlc3VsdClcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kKVxuICBPYmplY3QuYXNzaWduKHN0YXRlLCB7XG4gICAgVFNJWkU6IHJlc3VsdC5UU0laRSxcbiAgICBzY2hlZHVsZSxcbiAgICBzY2hlZHVsZVNpemVzOiByZXN1bHQuc2NoZWR1bGVTaXplcyxcbiAgICBzY2hlZHVsZVJhdGluZ3M6IHJlc3VsdC5zY2hlZHVsZVJhdGluZ3MsXG4gICAgdHJhblN0YXJ0OiByZXN1bHQudHJhblN0YXJ0LFxuICAgIHVuYXNzaWduZWQ6IHJlc3VsdC51bmFzc2lnbmVkLFxuICB9KVxuICBsZXQgdG90YWwgPSAwXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgbW9kLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgY29uc3QgZXhwZWN0ZWQgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKSwgcmVwb3J0ZWQgPSByZXN1bHQuc2NoZWR1bGVSYXRpbmdzW3RyYW5dIVxuICAgIGlmIChyZXBvcnRlZCAhPT0gZXhwZWN0ZWQpXG4gICAgICB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKGBUcmFuc3BvcnRlciAke3RyYW59IHNjb3JlIG1pc21hdGNoOiByZXBvcnRlZCAke3JlcG9ydGVkfSwgSlMgJHtleHBlY3RlZH1gKVxuICAgIHRvdGFsICs9IGV4cGVjdGVkXG4gIH1cbiAgaWYgKHJlc3VsdC50b3RhbFNjb3JlICE9PSB0b3RhbClcbiAgICB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKGBUb3RhbCBzY29yZSBtaXNtYXRjaDogcmVwb3J0ZWQgJHtyZXN1bHQudG90YWxTY29yZX0sIEpTICR7dG90YWx9YClcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGxhbm5lclZpZXcobW9kOiBNb2R1bGUpOiBQcm9taXNlPEhUTUxFbGVtZW50PiB7XG4gIGNvbnN0IG91dGVyQm9yZGVyID0gXCIxcHggc29saWQgXCIgKyBjb2xvci5ncmF5O1xuICBjb25zdCBpbm5lckJvcmRlciA9IFwiMXB4IHNvbGlkIFwiICsgY29sb3IubGlnaHRncmF5O1xuICBjb25zdCBjZWxsUGFkZGluZyA9IFwiLjM1ZW0gLjVlbVwiO1xuICBjb25zdCBzY2hlZHVsZUNlbGxNaW5IZWlnaHQgPSBcIjIuMWVtXCI7XG5cbiAgbGV0IGFubmVhbGVyOiBBbm5lYWxpbmdSZXN1bHQgfCBudWxsID0gbnVsbDtcbiAgbGV0IGFubmVhbGluZ1Nlc3Npb246IEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB8IG51bGwgPSBudWxsO1xuICBsZXQgYW5uZWFsaW5nVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBsZXQgcnVuSWQgPSAwO1xuXG4gIGZ1bmN0aW9uIGl0ZW1CdXR0b24oaXRlbTogbnVtYmVyLCBsb2FkPzogYm9vbGVhbikge1xuICAgIGNvbnN0IHJlcSA9IG1vZC5yZXF1ZXN0c1tpdGVtXSE7XG4gICAgY29uc3Qgc3AgPSBzcGFuKFxuICAgICAgaXRlbS50b1N0cmluZygpLnBhZFN0YXJ0KDMsIFwiIFwiKSxcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgYm9yZGVyOiBcIjJweCBzb2xpZCB0cmFuc3BhcmVudFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjJlbVwiLFxuICAgICAgICB3aGl0ZVNwYWNlOiBcInByZVwiLFxuICAgICAgICBmb250RmFtaWx5OiBcIm1vbm9zcGFjZVwiLFxuICAgICAgfSksXG4gICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBvcHVwKFxuICAgICAgICAgIHAoXCJpdGVtIFwiLCBpdGVtKSxcbiAgICAgICAgICB0YWJsZShcbiAgICAgICAgICAgIHRyKGNlbGwoXCJzdGF0dXNcIiksIGNlbGwobG9hZCA/IFwibG9hZFwiIDogbG9hZCA9PT0gZmFsc2UgPyBcInVubG9hZFwiIDogXCJ1bmFzc2lnbmVkXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJ2YWx1ZVwiKSwgY2VsbChyZXEudmFsdWVfZXVyICsgXCLigqxcIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcImRpc3RcIiksIGNlbGwobW9kLnJvYWRtYXAuZ2V0Q29zdE4ocmVxLnN0YXJ0UG9pbnQsIHJlcS5lbmRQb2ludCkgKyBcImttXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJkZWFkbGluZVwiKSwgY2VsbChyZXEuZGVhZGxpbmVfaC50b0ZpeGVkKDIpICsgXCJoXCIpKSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICApO1xuXG4gICAgbGV0IHBvaW50cyA9IFtcbiAgICAgIHsgbnVtYmVyOiByZXEuc3RhcnRQb2ludCwgbG9nbzogXCLwn5OmXCIgfSxcbiAgICAgIHsgbnVtYmVyOiByZXEuZW5kUG9pbnQsIGxvZ286IFwi8J+PoFwiIH0sXG4gICAgXTtcblxuICAgIGlmIChsb2FkID09PSB0cnVlKSBwb2ludHMgPSBbcG9pbnRzWzBdIV07XG4gICAgaWYgKGxvYWQgPT09IGZhbHNlKSBwb2ludHMgPSBbcG9pbnRzWzFdIV07XG5cbiAgICBzcC5vbm1vdXNlZW50ZXIgPSAoKSA9PiB7XG4gICAgICBzcC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbG9yLmdyZWVuO1xuICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50cyB9XSk7XG4gICAgfTtcbiAgICBzcC5vbm1vdXNlbGVhdmUgPSAoKSA9PiB7XG4gICAgICBzcC5zdHlsZS5ib3JkZXJDb2xvciA9IFwidHJhbnNwYXJlbnRcIjtcbiAgICB9O1xuICAgIHJldHVybiBzcDtcbiAgfVxuXG4gIGNvbnN0IGNlbGw6IHR5cGVvZiB0ZCA9ICguLi54KSA9PiB0ZChzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiIH0pLCAuLi54KTtcbiAgY29uc3QgY29udHJvbHMgPSBkaXYoc3R5bGUoeyBkaXNwbGF5OiBcImZsZXhcIiwgZ2FwOiBcIi41ZW1cIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZmxleFdyYXA6IFwid3JhcFwiIH0pKTtcbiAgY29uc3Qgc2NvcmVMaW5lID0gcCgpO1xuICBjb25zdCB0aW1lTGluZSA9IHAoKTtcbiAgY29uc3Qgc29sdmVyU2VsZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKTtcbiAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKGF2YWlsYWJsZVNvbHZlcnMpIGFzIFNvbHZlck5hbWVbXSkgc29sdmVyU2VsZWN0LmFkZChuZXcgT3B0aW9uKG5hbWUsIG5hbWUpKTtcbiAgc29sdmVyU2VsZWN0LnZhbHVlID0gSU5JVElBTF9TT0xWRVI7XG4gIGNvbnN0IHNvbHZlckxpbmUgPSBwKFwic29sdmVyOiBcIiwgc29sdmVyU2VsZWN0KTtcbiAgY29uc3QgZGV0YWlsV3JhcCA9IGRpdigpO1xuICBjb25zdCB0YWJsZVdyYXAgPSBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgb3ZlcmZsb3dYOiBcImF1dG9cIixcbiAgICAgIG92ZXJmbG93WTogXCJoaWRkZW5cIixcbiAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICB9KSxcbiAgKTtcblxuICBjb25zdCBydW5CdXR0b24gPSBidXR0b24oXCJzdGFydFwiKTtcbiAgY29uc3QgaGVhdEJ1dHRvbiA9IGJ1dHRvbihcImhlYXQgdXBcIik7XG4gIGxldCByZW5kZXJDb3VudGVyID0gMDtcblxuICBmdW5jdGlvbiBzdG9wU2VhcmNoKCkge1xuICAgIGlmIChhbm5lYWxpbmdUaW1lciAhPSBudWxsKSB7XG4gICAgICBjbGVhckludGVydmFsKGFubmVhbGluZ1RpbWVyKTtcbiAgICAgIGFubmVhbGluZ1RpbWVyID0gbnVsbDtcbiAgICB9XG4gICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gXCJzdGFydFwiO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyVGFibGUoKSB7XG4gICAgY29uc3QgdGFiID0gdGFibGUoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIH0pLFxuICAgICAgdHIoXG4gICAgICAgIHRoKFwidHJhbnNwb3J0ZXJcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICAgIHRoKFwidmFsdWVcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICAgIHRoKFwic3RlcHNcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICApLFxuICAgICAgbW9kLnN0YXJ0cG9zaXRpb25zLm1hcCgoc3RhcnQsIHRyYW4pID0+XG4gICAgICAgIHRyKFxuICAgICAgICAgIHRkKFxuICAgICAgICAgICAgdHJhbixcbiAgICAgICAgICAgIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHBvcHVwKFxuICAgICAgICAgICAgICAgIHAoXCJ0cmFuc3BvcnRlcjogXCIsIHRyYW4pLFxuICAgICAgICAgICAgICAgIHAoXCJzdGFydDogXCIsIHN0YXJ0KSxcbiAgICAgICAgICAgICAgICBwKFwic2NvcmU6IFwiLCBldXJvcyhhbm5lYWxlcj8uc2NoZWR1bGVSYXRpbmdzW3RyYW5dID8/IDApKSxcbiAgICAgICAgICAgICAgICBwKFwic3RlcHM6IFwiLCBhbm5lYWxlcj8uc2NoZWR1bGVTaXplc1t0cmFuXSEpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb25tb3VzZWVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnRzID0gW3sgbnVtYmVyOiBzdGFydCwgbG9nbzogXCLwn5qbXCIgfV07XG4gICAgICAgICAgICAgICAgaWYgKGFubmVhbGVyKSB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFubmVhbGVyLnNjaGVkdWxlU2l6ZXNbdHJhbl0hOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IGFubmVhbGVyLnNjaGVkdWxlW3RyYW4gKiBhbm5lYWxlci5UU0laRSArIGldITtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG1vZC5yZXF1ZXN0c1tnZXRSZXEoc3RlcCldITtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goeyBudW1iZXI6IGlzTG9hZChzdGVwKSA/IHJlcXVlc3Quc3RhcnRQb2ludCA6IHJlcXVlc3QuZW5kUG9pbnQsIGxvZ286IFwiXCIgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGhpZ2h0TGlnaHRzLnNldChbeyBwb2ludHMgfV0pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBvbm1vdXNlbGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWdodExpZ2h0cy5zZXQoW10pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICAgIHRkKGV1cm9zKGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0gPz8gMCksIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSkpLFxuICAgICAgICAgIHRkKFxuICAgICAgICAgICAgdGFibGUoXG4gICAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgWzAsIDFdLm1hcCgoZGVjaykgPT5cbiAgICAgICAgICAgICAgICB0cihcbiAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20oeyBsZW5ndGg6IGFubmVhbGVyIS5zY2hlZHVsZVNpemVzW3RyYW5dISB9LCAoXywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGVwID0gYW5uZWFsZXI/LnNjaGVkdWxlW3RyYW4gKiBhbm5lYWxlci5UU0laRSArIGldITtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZCA9IGlzTG9hZChzdGVwKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRkKFxuICAgICAgICAgICAgICAgICAgICAgIGdldERlY2soc3RlcCkgPT09IGRlY2sgPyBpdGVtQnV0dG9uKGdldFJlcShzdGVwKSwgISFsb2FkKSA6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGxvYWQgPyBjb2xvci5ibHVlIDogY29sb3IuZ3JlZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGlubmVyQm9yZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogXCIuMmVtIC4zZW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiBcIjIuNmVtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgYm9yZGVyOiBvdXRlckJvcmRlcixcbiAgICAgICAgICAgICAgcGFkZGluZzogXCIuMjVlbVwiLFxuICAgICAgICAgICAgICB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcblxuICAgIHRhYmxlV3JhcC5yZXBsYWNlQ2hpbGRyZW4odGFiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlclN0YXR1cygpIHtcbiAgICBpZiAoIWFubmVhbGVyKSByZXR1cm47XG4gICAgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gYHNjb3JlOiAke2V1cm9zKGFubmVhbGVyLnRvdGFsU2NvcmUpfWA7XG4gICAgdGltZUxpbmUudGV4dENvbnRlbnQgPSBgc2VhcmNoIHRpbWU6ICR7KGFubmVhbGVyIS5lbGFwc2VkTXMvMTAwMCkudG9GaXhlZCgyKX0gc2A7XG5cbiAgICBkZXRhaWxXcmFwLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIGRpdihcbiAgICAgICAgcChcImRldGFpbHNcIiksXG4gICAgICAgIHRhYmxlKFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdHIoY2VsbChcInVuYXNzaWduZWQgcmVxdWVzdHNcIiksIGNlbGwoQXJyYXkuZnJvbShhbm5lYWxlciEudW5hc3NpZ25lZCkubWFwKCh4LCBpKSA9PiAoeyB4LCBpIH0pKS5maWx0ZXIoKHgpID0+IHgueCkuZmxhdE1hcCgoeCkgPT4gW3NwYW4oXCIgXCIpLCBpdGVtQnV0dG9uKHguaSldKSkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJzZWFyY2ggdGltZVwiKSwgY2VsbChgJHthbm5lYWxlcj8uZWxhcHNlZE1zID8/IDB9bXNgKSksXG4gICAgICAgICAgdHIoY2VsbChcInNjb3JlXCIpLCBjZWxsKGV1cm9zKGFubmVhbGVyLnRvdGFsU2NvcmUpKSksXG4gICAgICAgICAgdHIoY2VsbChcInRyYW5zcG9ydGVyIGNvdW50XCIpLCBjZWxsKG1vZC5OVFJBTlMpKSxcbiAgICAgICAgICB0cihjZWxsKFwicmVxdWVzdCBjb3VudFwiKSwgY2VsbChtb2QuTlJFUVMpKSxcbiAgICAgICAgICB0cihjZWxsKFwiY29zdCBwZXIga21cIiksIGNlbGwoZXVyb3MoS01fQ09TVF9DRU5UUykpKSxcbiAgICAgICAgICB0cihjZWxsKFwiYXZlcmFnZSBzcGVlZFwiKSwgY2VsbChgJHtBVkdfU1BFRURfS01IfWttL2hgKSksXG4gICAgICAgICAgdHIoY2VsbChcInJlb3JnYW5pemF0aW9uIGNvc3RcIiksIGNlbGwoZXVyb3MoUkVPUkdfQ09TVF9DRU5UUykpKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcihmb3JjZVRhYmxlID0gZmFsc2UpIHtcbiAgICBpZiAoIWFubmVhbGVyKSByZXR1cm47XG4gICAgcmVuZGVyU3RhdHVzKCk7XG4gICAgaWYgKGZvcmNlVGFibGUgfHwgKHJlbmRlckNvdW50ZXIrKyAlIDQgPT09IDApKSByZW5kZXJUYWJsZSgpO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gcnVuU29sdmVyKG5hbWU6IFNvbHZlck5hbWUpIHtcbiAgICBzdG9wU2VhcmNoKCk7XG4gICAgY29uc3QgaWQgPSArK3J1bklkO1xuICAgIGFubmVhbGluZ1Nlc3Npb24gPSBudWxsO1xuICAgIGFubmVhbGVyID0gbnVsbDtcbiAgICBydW5CdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHNjb3JlTGluZS50ZXh0Q29udGVudCA9IFwicnVubmluZ+KAplwiO1xuICAgIHRhYmxlV3JhcC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICBsZXQgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQgfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgaWYgKG5hbWUgPT09IFwiaW1wcm92ZWRcIikge1xuICAgICAgICBhbm5lYWxpbmdTZXNzaW9uID0gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZCwgMV85MDBfMDAwKTtcbiAgICAgICAgcmVzdWx0ID0gYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoMTApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgYXZhaWxhYmxlU29sdmVyc1tuYW1lXShtb2QpO1xuICAgICAgfVxuICAgICAgYW5uZWFsZXIgPSBjaGVja2VkUmVzdWx0KG1vZCwgcmVzdWx0KTtcbiAgICAgIGlmIChpZCA9PT0gcnVuSWQpIHtcbiAgICAgICAgcmVuZGVyKHRydWUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBTY29yZU1pc21hdGNoRXJyb3IpIHRocm93IGVycm9yO1xuICAgICAgaWYgKGlkID09PSBydW5JZCkgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gYHNvbHZlciBmYWlsZWQ6ICR7U3RyaW5nKGVycm9yKX1gO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoaWQgPT09IHJ1bklkKSB7XG4gICAgICAgIHJ1bkJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBuYW1lID09PSBcImltcHJvdmVkXCIgPyBcInN0YXJ0XCIgOiBcInJ1blwiO1xuICAgICAgICBoZWF0QnV0dG9uLmhpZGRlbiA9IG5hbWUgIT09IFwiaW1wcm92ZWRcIjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBydW5CdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICBjb25zdCBuYW1lID0gc29sdmVyU2VsZWN0LnZhbHVlIGFzIFNvbHZlck5hbWU7XG4gICAgaWYgKG5hbWUgIT09IFwiaW1wcm92ZWRcIikge1xuICAgICAgdm9pZCBydW5Tb2x2ZXIobmFtZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChhbm5lYWxpbmdUaW1lciAhPSBudWxsKSB7XG4gICAgICBzdG9wU2VhcmNoKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJ1bkJ1dHRvbi50ZXh0Q29udGVudCA9IFwic3RvcFwiO1xuICAgIGFubmVhbGluZ1RpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICghYW5uZWFsaW5nU2Vzc2lvbikgcmV0dXJuO1xuICAgICAgYW5uZWFsZXIgPSBjaGVja2VkUmVzdWx0KG1vZCwgYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoMTIwKSk7XG4gICAgICByZW5kZXIoKTtcbiAgICB9LCAxNTApO1xuICB9O1xuXG4gIGhlYXRCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICBpZiAoIWFubmVhbGluZ1Nlc3Npb24pIHJldHVybjtcbiAgICBhbm5lYWxlciA9IGNoZWNrZWRSZXN1bHQobW9kLCBhbm5lYWxpbmdTZXNzaW9uLnJlaGVhdCgpKTtcbiAgICByZW5kZXIodHJ1ZSk7XG4gIH07XG5cbiAgc29sdmVyU2VsZWN0Lm9uY2hhbmdlID0gKCkgPT4gdm9pZCBydW5Tb2x2ZXIoc29sdmVyU2VsZWN0LnZhbHVlIGFzIFNvbHZlck5hbWUpO1xuICBjb250cm9scy5yZXBsYWNlQ2hpbGRyZW4ocnVuQnV0dG9uLCBoZWF0QnV0dG9uKTtcbiAgYXdhaXQgcnVuU29sdmVyKElOSVRJQUxfU09MVkVSKTtcblxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIHBhZGRpbmc6IFwiMWVtXCIsXG4gICAgICBvdmVyZmxvd1k6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dYOiBcImhpZGRlblwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiMFwiLFxuICAgIH0pLFxuICAgIGNvbnRyb2xzLFxuICAgIHNvbHZlckxpbmUsXG4gICAgc2NvcmVMaW5lLFxuICAgIHRpbWVMaW5lLFxuICAgIHRhYmxlV3JhcCxcbiAgICBkZXRhaWxXcmFwLFxuICApO1xufVxuIiwKICAgICJpbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdfYmFzZWxpbmVcIlxuaW1wb3J0IHsgYW5uZWFsaW5nV2FzbSB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdfd2FzbVwiXG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgeyBkaXYsIGgyLCBwLCBzdHlsZSB9IGZyb20gXCIuL2h0bWxcIlxuXG5sZXQgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHRcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFVwV2FzbShwbGFubmVyOiBNb2R1bGUpIHtcbiAgcmVzdWx0ID0gYXdhaXQgYW5uZWFsaW5nV2FzbShwbGFubmVyKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd2FzbVZpZXcoX3BsYW5uZXI6IE1vZHVsZSkge1xuICBpZiAoIXJlc3VsdCApIHRocm93IG5ldyBFcnJvcihcIldBU00gcGxhbm5lciBpcyBub3Qgc2V0IHVwXCIpXG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoeyBwYWRkaW5nOiBcIjFlbVwiIH0pLFxuICAgIGgyKFwiV0FTTSBwbGFubmVyXCIpLFxuICAgIHAoXCJhc3NpZ25lZDogXCIsIHJlc3VsdC51bmFzc2lnbmVkLmxlbmd0aCAtIHJlc3VsdC51bmFzc2lnbmVkLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApKSxcbiAgICBwKFwic2NoZWR1bGUgc3RlcHM6IFwiLCByZXN1bHQuc2NoZWR1bGVTaXplcy5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSksXG4gICAgcChcInNlYXJjaCB0aW1lOiBcIiwgcmVzdWx0LmVsYXBzZWRNcy50b0ZpeGVkKDIpLCBcIm1zXCIpLFxuICApXG59XG5cbiIsCiAgICAiLy8gYmxha2UzLnRzXG4vLyBQdXJlIFR5cGVTY3JpcHQgQkxBS0UzLTI1NiBpbXBsZW1lbnRhdGlvbi5cblxuY29uc3QgT1VUX0xFTiA9IDMyO1xuY29uc3QgQkxPQ0tfTEVOID0gNjQ7XG5jb25zdCBDSFVOS19MRU4gPSAxMDI0O1xuXG5jb25zdCBDSFVOS19TVEFSVCA9IDEgPDwgMDtcbmNvbnN0IENIVU5LX0VORCA9IDEgPDwgMTtcbmNvbnN0IFBBUkVOVCA9IDEgPDwgMjtcbmNvbnN0IFJPT1QgPSAxIDw8IDM7XG5cbmNvbnN0IElWOiByZWFkb25seSBudW1iZXJbXSA9IFtcbiAgMHg2YTA5ZTY2NyxcbiAgMHhiYjY3YWU4NSxcbiAgMHgzYzZlZjM3MixcbiAgMHhhNTRmZjUzYSxcbiAgMHg1MTBlNTI3ZixcbiAgMHg5YjA1Njg4YyxcbiAgMHgxZjgzZDlhYixcbiAgMHg1YmUwY2QxOSxcbl07XG5cbmNvbnN0IE1TR19TQ0hFRFVMRTogcmVhZG9ubHkgKHJlYWRvbmx5IG51bWJlcltdKVtdID0gW1xuICBbMCwgMSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTAsIDExLCAxMiwgMTMsIDE0LCAxNV0sXG4gIFsyLCA2LCAzLCAxMCwgNywgMCwgNCwgMTMsIDEsIDExLCAxMiwgNSwgOSwgMTQsIDE1LCA4XSxcbiAgWzMsIDQsIDEwLCAxMiwgMTMsIDIsIDcsIDE0LCA2LCA1LCA5LCAwLCAxMSwgMTUsIDgsIDFdLFxuICBbMTAsIDcsIDEyLCA5LCAxNCwgMywgMTMsIDE1LCA0LCAwLCAxMSwgMiwgNSwgOCwgMSwgNl0sXG4gIFsxMiwgMTMsIDksIDExLCAxNSwgMTAsIDE0LCA4LCA3LCAyLCA1LCAzLCAwLCAxLCA2LCA0XSxcbiAgWzksIDE0LCAxMSwgNSwgOCwgMTIsIDE1LCAxLCAxMywgMywgMCwgMTAsIDIsIDYsIDQsIDddLFxuICBbMTEsIDE1LCA1LCAwLCAxLCA5LCA4LCA2LCAxNCwgMTAsIDIsIDEyLCAzLCA0LCA3LCAxM10sXG5dO1xuXG5mdW5jdGlvbiByb3RyMzIoeDogbnVtYmVyLCBuOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKCh4ID4+PiBuKSB8ICh4IDw8ICgzMiAtIG4pKSkgPj4+IDA7XG59XG5cbmZ1bmN0aW9uIGFkZDMyKGE6IG51bWJlciwgYjogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIChhICsgYikgPj4+IDA7XG59XG5cbmZ1bmN0aW9uIGxvYWQzMkxFKGJ5dGVzOiBVaW50OEFycmF5LCBvZmZzZXQ6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoXG4gICAgYnl0ZXNbb2Zmc2V0XSEgfFxuICAgIChieXRlc1tvZmZzZXQgKyAxXSEgPDwgOCkgfFxuICAgIChieXRlc1tvZmZzZXQgKyAyXSEgPDwgMTYpIHxcbiAgICAoYnl0ZXNbb2Zmc2V0ICsgM10hIDw8IDI0KVxuICApID4+PiAwO1xufVxuXG5mdW5jdGlvbiBzdG9yZTMyTEUob3V0OiBVaW50OEFycmF5LCBvZmZzZXQ6IG51bWJlciwgdmFsdWU6IG51bWJlcik6IHZvaWQge1xuICBvdXRbb2Zmc2V0XSA9IHZhbHVlICYgMHhmZjtcbiAgb3V0W29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KSAmIDB4ZmY7XG4gIG91dFtvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpICYgMHhmZjtcbiAgb3V0W29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNCkgJiAweGZmO1xufVxuXG5mdW5jdGlvbiB3b3Jkc0Zyb21CbG9jayhibG9jazogVWludDhBcnJheSk6IG51bWJlcltdIHtcbiAgY29uc3Qgd29yZHMgPSBuZXcgQXJyYXk8bnVtYmVyPigxNikuZmlsbCgwKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICBjb25zdCBvZmZzZXQgPSBpICogNDtcbiAgICBpZiAob2Zmc2V0ICsgNCA8PSBibG9jay5sZW5ndGgpIHtcbiAgICAgIHdvcmRzW2ldID0gbG9hZDMyTEUoYmxvY2ssIG9mZnNldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB2YWx1ZSA9IDA7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDQ7IGorKykge1xuICAgICAgICBjb25zdCBieXRlID0gYmxvY2tbb2Zmc2V0ICsgal0gPz8gMDtcbiAgICAgICAgdmFsdWUgfD0gYnl0ZSA8PCAoOCAqIGopO1xuICAgICAgfVxuICAgICAgd29yZHNbaV0gPSB2YWx1ZSA+Pj4gMDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gd29yZHM7XG59XG5cbmZ1bmN0aW9uIGcoXG4gIHN0YXRlOiBudW1iZXJbXSxcbiAgYTogbnVtYmVyLFxuICBiOiBudW1iZXIsXG4gIGM6IG51bWJlcixcbiAgZDogbnVtYmVyLFxuICBteDogbnVtYmVyLFxuICBteTogbnVtYmVyLFxuKTogdm9pZCB7XG4gIHN0YXRlW2FdID0gYWRkMzIoYWRkMzIoc3RhdGVbYV0hLCBzdGF0ZVtiXSEpLCBteCk7XG4gIHN0YXRlW2RdID0gcm90cjMyKHN0YXRlW2RdISBeIHN0YXRlW2FdISwgMTYpO1xuICBzdGF0ZVtjXSA9IGFkZDMyKHN0YXRlW2NdISwgc3RhdGVbZF0hKTtcbiAgc3RhdGVbYl0gPSByb3RyMzIoc3RhdGVbYl0hIF4gc3RhdGVbY10hLCAxMik7XG5cbiAgc3RhdGVbYV0gPSBhZGQzMihhZGQzMihzdGF0ZVthXSEsIHN0YXRlW2JdISksIG15KTtcbiAgc3RhdGVbZF0gPSByb3RyMzIoc3RhdGVbZF0hIF4gc3RhdGVbYV0hLCA4KTtcbiAgc3RhdGVbY10gPSBhZGQzMihzdGF0ZVtjXSEsIHN0YXRlW2RdISk7XG4gIHN0YXRlW2JdID0gcm90cjMyKHN0YXRlW2JdISBeIHN0YXRlW2NdISwgNyk7XG59XG5cbmZ1bmN0aW9uIHJvdW5kKHN0YXRlOiBudW1iZXJbXSwgbXNnOiByZWFkb25seSBudW1iZXJbXSwgcm91bmRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHNjaGVkdWxlID0gTVNHX1NDSEVEVUxFW3JvdW5kSW5kZXhdITtcblxuICBnKHN0YXRlLCAwLCA0LCA4LCAxMiwgbXNnW3NjaGVkdWxlWzBdIV0hLCBtc2dbc2NoZWR1bGVbMV0hXSEpO1xuICBnKHN0YXRlLCAxLCA1LCA5LCAxMywgbXNnW3NjaGVkdWxlWzJdIV0hLCBtc2dbc2NoZWR1bGVbM10hXSEpO1xuICBnKHN0YXRlLCAyLCA2LCAxMCwgMTQsIG1zZ1tzY2hlZHVsZVs0XSFdISwgbXNnW3NjaGVkdWxlWzVdIV0hKTtcbiAgZyhzdGF0ZSwgMywgNywgMTEsIDE1LCBtc2dbc2NoZWR1bGVbNl0hXSEsIG1zZ1tzY2hlZHVsZVs3XSFdISk7XG5cbiAgZyhzdGF0ZSwgMCwgNSwgMTAsIDE1LCBtc2dbc2NoZWR1bGVbOF0hXSEsIG1zZ1tzY2hlZHVsZVs5XSFdISk7XG4gIGcoc3RhdGUsIDEsIDYsIDExLCAxMiwgbXNnW3NjaGVkdWxlWzEwXSFdISwgbXNnW3NjaGVkdWxlWzExXSFdISk7XG4gIGcoc3RhdGUsIDIsIDcsIDgsIDEzLCBtc2dbc2NoZWR1bGVbMTJdIV0hLCBtc2dbc2NoZWR1bGVbMTNdIV0hKTtcbiAgZyhzdGF0ZSwgMywgNCwgOSwgMTQsIG1zZ1tzY2hlZHVsZVsxNF0hXSEsIG1zZ1tzY2hlZHVsZVsxNV0hXSEpO1xufVxuXG5mdW5jdGlvbiBjb21wcmVzcyhcbiAgY3Y6IHJlYWRvbmx5IG51bWJlcltdLFxuICBibG9ja1dvcmRzOiByZWFkb25seSBudW1iZXJbXSxcbiAgY291bnRlcjogbnVtYmVyLFxuICBibG9ja0xlbjogbnVtYmVyLFxuICBmbGFnczogbnVtYmVyLFxuKTogbnVtYmVyW10ge1xuICBjb25zdCBjb3VudGVyTG93ID0gY291bnRlciA+Pj4gMDtcbiAgY29uc3QgY291bnRlckhpZ2ggPSBNYXRoLmZsb29yKGNvdW50ZXIgLyAweDEwMDAwMDAwMCkgPj4+IDA7XG5cbiAgY29uc3Qgc3RhdGUgPSBbXG4gICAgY3ZbMF0hLFxuICAgIGN2WzFdISxcbiAgICBjdlsyXSEsXG4gICAgY3ZbM10hLFxuICAgIGN2WzRdISxcbiAgICBjdls1XSEsXG4gICAgY3ZbNl0hLFxuICAgIGN2WzddISxcbiAgICBJVlswXSEsXG4gICAgSVZbMV0hLFxuICAgIElWWzJdISxcbiAgICBJVlszXSEsXG4gICAgY291bnRlckxvdyxcbiAgICBjb3VudGVySGlnaCxcbiAgICBibG9ja0xlbixcbiAgICBmbGFncyxcbiAgXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDc7IGkrKykge1xuICAgIHJvdW5kKHN0YXRlLCBibG9ja1dvcmRzLCBpKTtcbiAgfVxuXG4gIHJldHVybiBbXG4gICAgc3RhdGVbMF0hIF4gc3RhdGVbOF0hLFxuICAgIHN0YXRlWzFdISBeIHN0YXRlWzldISxcbiAgICBzdGF0ZVsyXSEgXiBzdGF0ZVsxMF0hLFxuICAgIHN0YXRlWzNdISBeIHN0YXRlWzExXSEsXG4gICAgc3RhdGVbNF0hIF4gc3RhdGVbMTJdISxcbiAgICBzdGF0ZVs1XSEgXiBzdGF0ZVsxM10hLFxuICAgIHN0YXRlWzZdISBeIHN0YXRlWzE0XSEsXG4gICAgc3RhdGVbN10hIF4gc3RhdGVbMTVdISxcbiAgICBzdGF0ZVs4XSEgXiBjdlswXSEsXG4gICAgc3RhdGVbOV0hIF4gY3ZbMV0hLFxuICAgIHN0YXRlWzEwXSEgXiBjdlsyXSEsXG4gICAgc3RhdGVbMTFdISBeIGN2WzNdISxcbiAgICBzdGF0ZVsxMl0hIF4gY3ZbNF0hLFxuICAgIHN0YXRlWzEzXSEgXiBjdls1XSEsXG4gICAgc3RhdGVbMTRdISBeIGN2WzZdISxcbiAgICBzdGF0ZVsxNV0hIF4gY3ZbN10hLFxuICBdLm1hcCgoeCkgPT4geCA+Pj4gMCk7XG59XG5cbmNsYXNzIE91dHB1dCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHJlYWRvbmx5IGlucHV0Q1Y6IHJlYWRvbmx5IG51bWJlcltdLFxuICAgIHJlYWRvbmx5IGJsb2NrV29yZHM6IHJlYWRvbmx5IG51bWJlcltdLFxuICAgIHJlYWRvbmx5IGNvdW50ZXI6IG51bWJlcixcbiAgICByZWFkb25seSBibG9ja0xlbjogbnVtYmVyLFxuICAgIHJlYWRvbmx5IGZsYWdzOiBudW1iZXIsXG4gICkge31cblxuICBjaGFpbmluZ1ZhbHVlKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gY29tcHJlc3MoXG4gICAgICB0aGlzLmlucHV0Q1YsXG4gICAgICB0aGlzLmJsb2NrV29yZHMsXG4gICAgICB0aGlzLmNvdW50ZXIsXG4gICAgICB0aGlzLmJsb2NrTGVuLFxuICAgICAgdGhpcy5mbGFncyxcbiAgICApLnNsaWNlKDAsIDgpO1xuICB9XG5cbiAgcm9vdEJ5dGVzKG91dExlbiA9IE9VVF9MRU4pOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShvdXRMZW4pO1xuICAgIGxldCBvZmZzZXQgPSAwO1xuICAgIGxldCBvdXRwdXRCbG9ja0NvdW50ZXIgPSAwO1xuXG4gICAgd2hpbGUgKG9mZnNldCA8IG91dExlbikge1xuICAgICAgY29uc3Qgd29yZHMgPSBjb21wcmVzcyhcbiAgICAgICAgdGhpcy5pbnB1dENWLFxuICAgICAgICB0aGlzLmJsb2NrV29yZHMsXG4gICAgICAgIG91dHB1dEJsb2NrQ291bnRlcixcbiAgICAgICAgdGhpcy5ibG9ja0xlbixcbiAgICAgICAgdGhpcy5mbGFncyB8IFJPT1QsXG4gICAgICApO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2ICYmIG9mZnNldCA8IG91dExlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHdvcmRCeXRlcyA9IG5ldyBVaW50OEFycmF5KDQpO1xuICAgICAgICBzdG9yZTMyTEUod29yZEJ5dGVzLCAwLCB3b3Jkc1tpXSEpO1xuXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgNCAmJiBvZmZzZXQgPCBvdXRMZW47IGorKykge1xuICAgICAgICAgIG91dFtvZmZzZXRdID0gd29yZEJ5dGVzW2pdITtcbiAgICAgICAgICBvZmZzZXQrKztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBvdXRwdXRCbG9ja0NvdW50ZXIrKztcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xuICB9XG59XG5cbmZ1bmN0aW9uIGNodW5rT3V0cHV0KFxuICBjaHVuazogVWludDhBcnJheSxcbiAga2V5OiByZWFkb25seSBudW1iZXJbXSxcbiAgY2h1bmtDb3VudGVyOiBudW1iZXIsXG4gIGZsYWdzOiBudW1iZXIsXG4pOiBPdXRwdXQge1xuICBsZXQgY3YgPSBbLi4ua2V5XTtcblxuICBjb25zdCBibG9ja0NvdW50ID0gTWF0aC5tYXgoMSwgTWF0aC5jZWlsKGNodW5rLmxlbmd0aCAvIEJMT0NLX0xFTikpO1xuXG4gIGZvciAobGV0IGJsb2NrSW5kZXggPSAwOyBibG9ja0luZGV4IDwgYmxvY2tDb3VudDsgYmxvY2tJbmRleCsrKSB7XG4gICAgY29uc3QgYmxvY2tTdGFydCA9IGJsb2NrSW5kZXggKiBCTE9DS19MRU47XG4gICAgY29uc3QgYmxvY2sgPSBjaHVuay5zdWJhcnJheShibG9ja1N0YXJ0LCBibG9ja1N0YXJ0ICsgQkxPQ0tfTEVOKTtcbiAgICBjb25zdCBibG9ja1dvcmRzID0gd29yZHNGcm9tQmxvY2soYmxvY2spO1xuXG4gICAgY29uc3QgaXNGaXJzdEJsb2NrID0gYmxvY2tJbmRleCA9PT0gMDtcbiAgICBjb25zdCBpc0xhc3RCbG9jayA9IGJsb2NrSW5kZXggPT09IGJsb2NrQ291bnQgLSAxO1xuXG4gICAgY29uc3QgYmxvY2tGbGFncyA9XG4gICAgICBmbGFncyB8XG4gICAgICAoaXNGaXJzdEJsb2NrID8gQ0hVTktfU1RBUlQgOiAwKSB8XG4gICAgICAoaXNMYXN0QmxvY2sgPyBDSFVOS19FTkQgOiAwKTtcblxuICAgIGlmIChpc0xhc3RCbG9jaykge1xuICAgICAgcmV0dXJuIG5ldyBPdXRwdXQoY3YsIGJsb2NrV29yZHMsIGNodW5rQ291bnRlciwgYmxvY2subGVuZ3RoLCBibG9ja0ZsYWdzKTtcbiAgICB9XG5cbiAgICBjdiA9IGNvbXByZXNzKGN2LCBibG9ja1dvcmRzLCBjaHVua0NvdW50ZXIsIEJMT0NLX0xFTiwgYmxvY2tGbGFncykuc2xpY2UoMCwgOCk7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKTtcbn1cblxuZnVuY3Rpb24gcGFyZW50T3V0cHV0KFxuICBsZWZ0Q1Y6IHJlYWRvbmx5IG51bWJlcltdLFxuICByaWdodENWOiByZWFkb25seSBudW1iZXJbXSxcbiAga2V5OiByZWFkb25seSBudW1iZXJbXSxcbiAgZmxhZ3M6IG51bWJlcixcbik6IE91dHB1dCB7XG4gIGNvbnN0IGJsb2NrV29yZHMgPSBbLi4ubGVmdENWLCAuLi5yaWdodENWXTtcbiAgcmV0dXJuIG5ldyBPdXRwdXQoa2V5LCBibG9ja1dvcmRzLCAwLCBCTE9DS19MRU4sIGZsYWdzIHwgUEFSRU5UKTtcbn1cblxuZnVuY3Rpb24gcGFyZW50Q1YoXG4gIGxlZnRDVjogcmVhZG9ubHkgbnVtYmVyW10sXG4gIHJpZ2h0Q1Y6IHJlYWRvbmx5IG51bWJlcltdLFxuICBrZXk6IHJlYWRvbmx5IG51bWJlcltdLFxuICBmbGFnczogbnVtYmVyLFxuKTogbnVtYmVyW10ge1xuICByZXR1cm4gcGFyZW50T3V0cHV0KGxlZnRDViwgcmlnaHRDViwga2V5LCBmbGFncykuY2hhaW5pbmdWYWx1ZSgpO1xufVxuXG5mdW5jdGlvbiBsYXJnZXN0UG93ZXJPZlR3b0xlc3NUaGFuKG46IG51bWJlcik6IG51bWJlciB7XG4gIGxldCBwb3dlciA9IDE7XG4gIHdoaWxlIChwb3dlciAqIDIgPCBuKSB7XG4gICAgcG93ZXIgKj0gMjtcbiAgfVxuICByZXR1cm4gcG93ZXI7XG59XG5cbmZ1bmN0aW9uIGxlZnRMZW4oaW5wdXRMZW46IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGZ1bGxDaHVua3MgPSBNYXRoLmZsb29yKChpbnB1dExlbiAtIDEpIC8gQ0hVTktfTEVOKTtcbiAgcmV0dXJuIGxhcmdlc3RQb3dlck9mVHdvTGVzc1RoYW4oZnVsbENodW5rcyArIDEpICogQ0hVTktfTEVOO1xufVxuXG5mdW5jdGlvbiBzdWJ0cmVlT3V0cHV0KFxuICBpbnB1dDogVWludDhBcnJheSxcbiAga2V5OiByZWFkb25seSBudW1iZXJbXSxcbiAgY2h1bmtDb3VudGVyOiBudW1iZXIsXG4gIGZsYWdzOiBudW1iZXIsXG4pOiBPdXRwdXQge1xuICBpZiAoaW5wdXQubGVuZ3RoIDw9IENIVU5LX0xFTikge1xuICAgIHJldHVybiBjaHVua091dHB1dChpbnB1dCwga2V5LCBjaHVua0NvdW50ZXIsIGZsYWdzKTtcbiAgfVxuXG4gIGNvbnN0IGxlZnRMZW5ndGggPSBsZWZ0TGVuKGlucHV0Lmxlbmd0aCk7XG5cbiAgY29uc3QgbGVmdCA9IGlucHV0LnN1YmFycmF5KDAsIGxlZnRMZW5ndGgpO1xuICBjb25zdCByaWdodCA9IGlucHV0LnN1YmFycmF5KGxlZnRMZW5ndGgpO1xuXG4gIGNvbnN0IGxlZnRDViA9IHN1YnRyZWVPdXRwdXQobGVmdCwga2V5LCBjaHVua0NvdW50ZXIsIGZsYWdzKS5jaGFpbmluZ1ZhbHVlKCk7XG4gIGNvbnN0IHJpZ2h0Q1YgPSBzdWJ0cmVlT3V0cHV0KFxuICAgIHJpZ2h0LFxuICAgIGtleSxcbiAgICBjaHVua0NvdW50ZXIgKyBsZWZ0TGVuZ3RoIC8gQ0hVTktfTEVOLFxuICAgIGZsYWdzLFxuICApLmNoYWluaW5nVmFsdWUoKTtcblxuICByZXR1cm4gcGFyZW50T3V0cHV0KGxlZnRDViwgcmlnaHRDViwga2V5LCBmbGFncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBibGFrZTMoaW5wdXQ6IFVpbnQ4QXJyYXkgfCBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgYnl0ZXMgPVxuICAgIHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShpbnB1dCkgOiBpbnB1dDtcblxuICByZXR1cm4gc3VidHJlZU91dHB1dChieXRlcywgSVYsIDAsIDApLnJvb3RCeXRlcyhPVVRfTEVOKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJsYWtlM0hleChpbnB1dDogVWludDhBcnJheSB8IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBbLi4uYmxha2UzKGlucHV0KV1cbiAgICAubWFwKChieXRlKSA9PiBieXRlLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikpXG4gICAgLmpvaW4oXCJcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNoIChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGJsYWtlM0hleChpbnB1dCkuc2xpY2UoMCwgMTYpO1xufVxuIiwKICAgICJpbXBvcnQgeyBoYXNoIH0gZnJvbSBcIi4vaGFzaFwiO1xuaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tLCBzZXRSYW5kU2VlZCB9IGZyb20gXCIuL3JhbmRvbVwiO1xuaW1wb3J0IHsgcmFuZG9tVVVJRCwgdHlwZSBNb2R1bGUsIHR5cGUgUmVxdWVzdCB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBSRUFMX1JPQURNQVBfVkVSU0lPTiA9IDE7XG5cbmV4cG9ydCB0eXBlIERlYWxlclNpdGUgPSB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgbG9uOiBudW1iZXI7XG4gIGxhdDogbnVtYmVyO1xuICBzb3VyY2U6IFwib3BlbnN0cmVldG1hcFwiO1xufTtcblxuZXhwb3J0IHR5cGUgUmVhbFJvYWRNYXBDYWNoZSA9IHtcbiAgdmVyc2lvbjogdHlwZW9mIFJFQUxfUk9BRE1BUF9WRVJTSU9OO1xuICBnZW5lcmF0ZWRBdDogc3RyaW5nO1xuICByb3V0aW5nUHJvZmlsZTogXCJkcml2aW5nLWhndlwiO1xuICByb3V0aW5nU291cmNlPzogXCJvcGVucm91dGVzZXJ2aWNlXCIgfCBcImFwcHJveGltYXRlXCI7XG4gIHNvdXJjZUhhc2g6IHN0cmluZztcbiAgc2l0ZXM6IERlYWxlclNpdGVbXTtcbiAgLyoqIFN5bW1ldHJpYywgcGFja2VkLCBpbnRlZ2VyIGtpbG9tZXRyZXM7IGNvbXBhdGlibGUgd2l0aCB0aGUgZXhpc3RpbmcgV0FTTSBzb2x2ZXIuICovXG4gIGRpc3RhbmNlc0ttOiBudW1iZXJbXTtcbiAgLyoqIFN5bW1ldHJpYywgcGFja2VkIHRyYXZlbCBtaW51dGVzLiBLZXB0IGZvciByZWFsaXN0aWMgZGVhZGxpbmVzIGFuZCBmdXR1cmUgc2NvcmluZy4gKi9cbiAgZHVyYXRpb25zTWludXRlczogbnVtYmVyW107XG59O1xuXG5leHBvcnQgdHlwZSBSZWFsUG9zID0ge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbiAgbG9uOiBudW1iZXI7XG4gIGxhdDogbnVtYmVyO1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcGFja2VkUm9hZEluZGV4KHBvaW50Q291bnQ6IG51bWJlciwgZnJvbTogbnVtYmVyLCB0bzogbnVtYmVyKTogbnVtYmVyIHtcbiAgaWYgKGZyb20gPT09IHRvKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZ2V0IGEgcm9hZCBmcm9tIGEgcG9pbnQgdG8gaXRzZWxmXCIpO1xuICBsZXQgYSA9IGZyb207XG4gIGxldCBiID0gdG87XG4gIGlmIChhIDwgYikgW2EsIGJdID0gW2IsIGFdO1xuICBsZXQgaW5kZXggPSBhICsgcG9pbnRDb3VudCAqIGI7XG4gIGNvbnN0IHBhY2tlZFNpemUgPSBwb2ludENvdW50ICogcG9pbnRDb3VudCAvIDI7XG4gIGlmIChpbmRleCA+IHBhY2tlZFNpemUpIGluZGV4ID0gcG9pbnRDb3VudCAqKiAyIC0gaW5kZXg7XG4gIHJldHVybiBpbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWxSb2FkTWFwRnJvbUNhY2hlKGNhY2hlOiBSZWFsUm9hZE1hcENhY2hlKSB7XG4gIGlmIChjYWNoZS52ZXJzaW9uICE9PSBSRUFMX1JPQURNQVBfVkVSU0lPTikge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgcmVhbC1yb2FkbWFwIGNhY2hlIHZlcnNpb24gJHtjYWNoZS52ZXJzaW9ufWApO1xuICB9XG5cbiAgY29uc3QgcG9pbnRDb3VudCA9IGNhY2hlLnNpdGVzLmxlbmd0aDtcbiAgaWYgKHBvaW50Q291bnQgJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGV4aXN0aW5nIHBhY2tlZCBXQVNNIG1hdHJpeCBsYXlvdXQgcmVxdWlyZXMgYW4gZXZlbiBudW1iZXIgb2Ygc2l0ZXNcIik7XG4gIH1cbiAgY29uc3QgbWF0cml4U2l6ZSA9IHBvaW50Q291bnQgKiBwb2ludENvdW50IC8gMjtcbiAgaWYgKGNhY2hlLmRpc3RhbmNlc0ttLmxlbmd0aCAhPT0gbWF0cml4U2l6ZSB8fCBjYWNoZS5kdXJhdGlvbnNNaW51dGVzLmxlbmd0aCAhPT0gbWF0cml4U2l6ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCByZWFsLXJvYWRtYXAgbWF0cml4IHNpemUgZm9yICR7cG9pbnRDb3VudH0gc2l0ZXNgKTtcbiAgfVxuXG4gIGNvbnN0IENvc3RNYXRyaXggPSBVaW50MzJBcnJheS5mcm9tKGNhY2hlLmRpc3RhbmNlc0ttKTtcbiAgY29uc3QgRHVyYXRpb25NYXRyaXggPSBVaW50MzJBcnJheS5mcm9tKGNhY2hlLmR1cmF0aW9uc01pbnV0ZXMpO1xuICBjb25zdCBwb2ludHM6IFJlYWxQb3NbXSA9IGNhY2hlLnNpdGVzLm1hcChzaXRlID0+ICh7XG4gICAgeDogc2l0ZS5sb24sXG4gICAgeTogc2l0ZS5sYXQsXG4gICAgbG9uOiBzaXRlLmxvbixcbiAgICBsYXQ6IHNpdGUubGF0LFxuICAgIGlkOiBzaXRlLmlkLFxuICAgIG5hbWU6IHNpdGUubmFtZSxcbiAgfSkpO1xuICBjb25zdCByYW5nZSA9IEFycmF5LmZyb20oeyBsZW5ndGg6IHBvaW50Q291bnQgfSwgKF8sIGluZGV4KSA9PiBpbmRleCk7XG4gIGNvbnN0IHJvYWRJRFggPSAoZnJvbTogbnVtYmVyLCB0bzogbnVtYmVyKSA9PiBwYWNrZWRSb2FkSW5kZXgocG9pbnRDb3VudCwgZnJvbSwgdG8pO1xuICBjb25zdCBnZXRyb2FkID0gKGZyb206IG51bWJlciwgdG86IG51bWJlcikgPT4gQ29zdE1hdHJpeFtyb2FkSURYKGZyb20sIHRvKV0hO1xuICBjb25zdCBmaW5kUGF0aCA9IChmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIpID0+IGZyb20gPT09IHRvID8gW2Zyb21dIDogW2Zyb20sIHRvXTtcbiAgY29uc3QgZ2V0Q29zdE4gPSAoLi4uc3RvcHM6IG51bWJlcltdKSA9PiBzdW1MZWdzKENvc3RNYXRyaXgsIHJvYWRJRFgsIHN0b3BzKTtcbiAgY29uc3QgZ2V0RHVyYXRpb25NaW51dGVzTiA9ICguLi5zdG9wczogbnVtYmVyW10pID0+IHN1bUxlZ3MoRHVyYXRpb25NYXRyaXgsIHJvYWRJRFgsIHN0b3BzKTtcblxuICByZXR1cm4ge1xuICAgIHBvaW50cyxcbiAgICByYW5nZSxcbiAgICBDb3N0TWF0cml4LFxuICAgIER1cmF0aW9uTWF0cml4LFxuICAgIHJvYWRJRFgsXG4gICAgZ2V0cm9hZCxcbiAgICBmaW5kUGF0aCxcbiAgICBnZXRDb3N0TixcbiAgICBnZXREdXJhdGlvbk1pbnV0ZXNOLFxuICAgIGNhY2hlLFxuICB9O1xufVxuXG5mdW5jdGlvbiBzdW1MZWdzKG1hdHJpeDogVWludDMyQXJyYXksIGluZGV4OiAoYTogbnVtYmVyLCBiOiBudW1iZXIpID0+IG51bWJlciwgc3RvcHM6IG51bWJlcltdKSB7XG4gIGxldCB0b3RhbCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpICsgMSA8IHN0b3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHN0b3BzW2ldICE9PSBzdG9wc1tpICsgMV0pIHRvdGFsICs9IG1hdHJpeFtpbmRleChzdG9wc1tpXSEsIHN0b3BzW2kgKyAxXSEpXSE7XG4gIH1cbiAgcmV0dXJuIHRvdGFsO1xufVxuXG4vKiogQ3JlYXRlcyBub3JtYWwgcGxhbm5lciBpbnB1dCBmcm9tIGEgY2FjaGVkIHJlYWwgbWFwIHdpdGhvdXQgY2hhbmdpbmcgdGhlIHN5bnRoZXRpYyBnZW5lcmF0b3IuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhbE1vZHVsZShcbiAgcm9hZG1hcDogUmV0dXJuVHlwZTx0eXBlb2YgcmVhbFJvYWRNYXBGcm9tQ2FjaGU+LFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIHNlZWQgPSAyMixcbik6IE1vZHVsZSB7XG4gIGlmIChyb2FkbWFwLnBvaW50cy5sZW5ndGggPCAyKSB0aHJvdyBuZXcgRXJyb3IoXCJBIHJlYWwgcm9hZG1hcCBuZWVkcyBhdCBsZWFzdCB0d28gZGVhbGVyIHNpdGVzXCIpO1xuICBzZXRSYW5kU2VlZChzZWVkKTtcblxuICBjb25zdCBkaWZmZXJlbnRQb2ludCA9IChmcm9tOiBudW1iZXIpID0+IHtcbiAgICBsZXQgdG8gPSByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpO1xuICAgIHdoaWxlICh0byA9PT0gZnJvbSkgdG8gPSByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpO1xuICAgIHJldHVybiB0bztcbiAgfTtcblxuICBjb25zdCByZXF1ZXN0cyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IE5SRVFTIH0sICgpID0+IHtcbiAgICBjb25zdCBzdGFydFBvaW50ID0gcmFuZENob2ljZShyb2FkbWFwLnJhbmdlKTtcbiAgICBjb25zdCBlbmRQb2ludCA9IGRpZmZlcmVudFBvaW50KHN0YXJ0UG9pbnQpO1xuICAgIGNvbnN0IGRpcmVjdE1pbnV0ZXMgPSByb2FkbWFwLmdldER1cmF0aW9uTWludXRlc04oc3RhcnRQb2ludCwgZW5kUG9pbnQpO1xuICAgIHJldHVybiB7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgc3RhcnRQb2ludCxcbiAgICAgIGVuZFBvaW50LFxuICAgICAgdmFsdWVfZXVyOiByYW5kSW50KDE1MCwgNjAwKSxcbiAgICAgIGRlYWRsaW5lX2g6IChkaXJlY3RNaW51dGVzICsgNCAqIDYwICsgcmFuZG9tKCkgKiAzNiAqIDYwKSAvIDYwLFxuICAgIH0gc2F0aXNmaWVzIFJlcXVlc3Q7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkU6IDEsXG4gICAgUlNJWkU6IHJvYWRtYXAuQ29zdE1hdHJpeC5sZW5ndGgsXG4gICAgcm9hZG1hcCxcbiAgICByZXF1ZXN0cyxcbiAgICBzdGFydHBvc2l0aW9uczogQXJyYXkuZnJvbSh7IGxlbmd0aDogTlRSQU5TIH0sICgpID0+IHJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSkpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhbFJvYWRNYXBTb3VyY2VIYXNoKHNpdGVzOiBEZWFsZXJTaXRlW10sIHJvdXRpbmdQcm9maWxlID0gXCJkcml2aW5nLWhndlwiKSB7XG4gIHJldHVybiBoYXNoKEpTT04uc3RyaW5naWZ5KHsgdmVyc2lvbjogUkVBTF9ST0FETUFQX1ZFUlNJT04sIHJvdXRpbmdQcm9maWxlLCBzaXRlcyB9KSk7XG59XG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi4vaGFzaFwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBlcnJvcnBvcHVwLCBoMSwgaDIsIGgzLCBpbnB1dCwgbWFyZ2luLCBwLCBwYWRkaW5nLCBwb3B1cCwgcHJlLCBzcGFuLCBzdHlsZSwgdGFibGUsIHdpZHRoLCB0ZXh0YXJlYSwgYSwgYm9yZGVyLCBodG1sLCB0aCwgdHIsIHRkLCBib3JkZXJSYWRpdXMsIHBhbmVsTGlzdCwgZGlzcGxheSwgYmFja2dyb3VuZCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1hcFZpZXcgfSBmcm9tIFwiLi9tYXBWaWV3XCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi4vcm9hZG1hcFwiO1xuaW1wb3J0IHsgcmFuZG9tTW9kdWxlLCByYW5kb21VVUlELCBSZXF1ZXN0LCBTY2hlZHVsZSwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgbWtTdG9yZWQsIG1rV3JpdGFibGUsIHR5cGUgV3JpdGFibGUgfSBmcm9tIFwiLi4vd3JpdGVhYmxlXCI7XG5pbXBvcnQgeyBzZXRSYW5kU2VlZCB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB7IG51bWJlciB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmltcG9ydCB7IHBsYW5uZXJWaWV3IH0gZnJvbSBcIi4uL3BsYW5uZXJzL2FubmVhbGluZ1wiO1xuaW1wb3J0IHsgc2V0VXBXYXNtLCB3YXNtVmlldyB9IGZyb20gXCIuL3dhc212aWV3XCI7XG5pbXBvcnQgeyByZWFsTW9kdWxlLCByZWFsUm9hZE1hcEZyb21DYWNoZSwgdHlwZSBSZWFsUm9hZE1hcENhY2hlIH0gZnJvbSBcIi4uL3JlYWxfcm9hZG1hcFwiO1xuXG5cbmV4cG9ydCBsZXQgTEtXX0NPVU5UID0gbWtTdG9yZWQoXCJMS1dfQ09VTlRcIiwgbnVtYmVyLCAgNSlcbmxldCBSRVFVRVNUX0NPVU5UID0gbWtTdG9yZWQoXCJSRVFVRVNUX0NPVU5UXCIsICBudW1iZXIsIDIwKVxuXG5ib2R5LnN0eWxlLm1hcmdpbiA9IFwiMFwiXG5cbmxldCBoZWFkZXIgPSBoMShcInJvdXRlIHBsYW5uZXJcIiwgc3R5bGUoe2JhY2tncm91bmQ6IGNvbG9yLmJsdWUsIGNvbG9yOiBjb2xvci5iYWNrZ3JvdW5kLCBtYXJnaW46IFwiMFwiLCBwYWRkaW5nOiBcIi42ZW1cIn0pKVxuXG5sZXQgY29udGVudFNwYWNlID0gZGl2KHN0eWxlKHtcbiAgZGlzcGxheTpcImZsZXhcIixcbiAgZmxleERpcmVjdGlvbjpcInJvd1wiLFxuICB3aWR0aDogXCIxMDAlXCIsXG4gIGhlaWdodDogXCJjYWxjKDEwMCUgLSAyLjVlbSlcIixcbiAgbWluV2lkdGg6IFwiMFwiLFxufSkpXG5cbmxldCBwYWdlID0gZGl2KFxuICBzdHlsZSh7ZGlzcGxheTpcImZsZXhcIiwgZmxleERpcmVjdGlvbjpcImNvbHVtblwiLCBoZWlnaHQ6IFwiMTAwJVwifSksXG4gIGhlYWRlcixcbiAgY29udGVudFNwYWNlXG4pXG5cbmJvZHkucmVwbGFjZUNoaWxkcmVuKHBhZ2UpXG5cbnNldFJhbmRTZWVkKDI0KVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsTW9kdWxlKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXCIuL3JlYWwtcm9hZG1hcC5qc29uXCIpXG4gICAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgbmV3IEVycm9yKGF3YWl0IHJlc3BvbnNlLnRleHQoKSlcbiAgICBjb25zdCBjYWNoZSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKSBhcyBSZWFsUm9hZE1hcENhY2hlXG4gICAgY29uc3Qgcm9hZG1hcCA9IHJlYWxSb2FkTWFwRnJvbUNhY2hlKGNhY2hlKVxuICAgIGNvbnNvbGUuaW5mbyhgVXNpbmcgY2FjaGVkIHJlYWwgcm9hZG1hcCB3aXRoICR7cm9hZG1hcC5wb2ludHMubGVuZ3RofSBjYXIgZGVhbGVyc2ApXG4gICAgcmV0dXJuIHJlYWxNb2R1bGUocm9hZG1hcCwgUkVRVUVTVF9DT1VOVC5nZXQoKSwgTEtXX0NPVU5ULmdldCgpLCAyNClcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmluZm8oXCJVc2luZyBzeW50aGV0aWMgcm9hZG1hcDsgYnVpbGQgdGhlIHJlYWwtcm9hZG1hcCBjYWNoZSB0byBlbmFibGUgR2VybWFueSBkYXRhXCIsIGVycm9yKVxuICAgIHJldHVybiByYW5kb21Nb2R1bGUoUkVRVUVTVF9DT1VOVC5nZXQoKSwgTEtXX0NPVU5ULmdldCgpKVxuICB9XG59XG5cbmV4cG9ydCBsZXQgbW9kdWxlID0gYXdhaXQgaW5pdGlhbE1vZHVsZSgpXG5cbmV4cG9ydCB0eXBlIEhpZ2hMaWdodCA9IHtcbiAgcG9pbnRzOiB7XG4gICAgbnVtYmVyOiBudW1iZXIsXG4gICAgbG9nbz8gOiBzdHJpbmcsXG4gIH1bXSxcbiAgY29sb3I/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGxldCBoaWdodExpZ2h0cyA9IG1rV3JpdGFibGUgPEhpZ2hMaWdodFtdPiggW10gKVxuXG5cbmZ1bmN0aW9uIHNldHRlciAoc3RvcmU6IFdyaXRhYmxlPG51bWJlcj4gKXtcbiAgbGV0IGlucCA9IGlucHV0KClcbiAgaW5wLnR5cGUgPSBcIm51bWJlclwiXG4gIGlucC5vbmNoYW5nZSA9ICgpPT57XG4gICAgbGV0IHZhbCA9IHBhcnNlSW50KGlucC52YWx1ZSlcbiAgICBpZiAoaXNOYU4odmFsKSkgcmV0dXJuXG4gICAgc3RvcmUuc2V0KHZhbClcbiAgfVxuICBzdG9yZS5vbnVwZGF0ZSh2YWw9PmlucC52YWx1ZSA9IHZhbC50b1N0cmluZygpKVxuXG4gIHJldHVybiBpbnBcbn1cblxuXG5hd2FpdCBzZXRVcFdhc20obW9kdWxlKVxuXG5hc3luYyBmdW5jdGlvbiBta1dpbmRvdyAodGFiOiBudW1iZXIgPSAwICkge1xuXG4gIGxldCB0YWJGaWVsZHMgPSBbXG4gICAgWydtYXAnLCBtYXBWaWV3KG1vZHVsZSldLFxuICAgIFsncGxhbm5lcicsIGF3YWl0IHBsYW5uZXJWaWV3KG1vZHVsZSldLFxuICAgIFsnd2FzbScsIHdhc21WaWV3KG1vZHVsZSldXG4gIF0gYXMgY29uc3RcblxuICBjb25zdCBlbCA9IGRpdihzdHlsZSh7XG4gICAgZmxleDogXCIxIDEgMFwiLFxuICAgIG1pbldpZHRoOiBcIjBcIixcbiAgICBoZWlnaHQ6IFwiY2FsYygxMDB2aCAtIDFlbSlcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgfSkpXG5cbiAgZnVuY3Rpb24gb3BlblRhYih0YWI6IHR5cGVvZiB0YWJGaWVsZHNbbnVtYmVyXVswXSkge1xuICAgIGNvbnN0IHRhYnMgPSBwKFxuICAgICAgc3R5bGUoe1xuICAgICAgICBtYXJnaW46IFwiMFwiLFxuICAgICAgICBwYWRkaW5nOiBcIi40ZW1cIixcbiAgICAgICAgZmxleDogXCIwIDAgYXV0b1wiLFxuICAgICAgfSksXG4gICAgICB0YWJGaWVsZHMubWFwKChbbixlXSk9PlxuICAgICAgICBzcGFuKCBuLFxuICAgICAgICAgICgpPT5vcGVuVGFiKG4pLFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjNlbVwiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIi4zZW1cIixcbiAgICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiKyAobj09dGFiID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5KSxcbiAgICAgICAgICAgIGNvbG9yOiAobj09dGFiKSA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApXG4gICAgKVxuXG4gICAgY29uc3QgY29udGVudCA9IGRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgZmxleDogXCIxIDEgYXV0b1wiLFxuICAgICAgICBtaW5IZWlnaHQ6IFwiMFwiLFxuICAgICAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgICB9KSxcbiAgICAgIHRhYkZpZWxkcy5maW5kKChbbixdKT0+bj09dGFiKSFbMV1cbiAgICApXG5cbiAgICBlbC5yZXBsYWNlQ2hpbGRyZW4oXG4gICAgICB0YWJzLFxuICAgICAgY29udGVudFxuICAgIClcbiAgfVxuXG4gIG9wZW5UYWIodGFiRmllbGRzW3RhYl0hWzBdKVxuXG4gIHJldHVybiBlbFxufVxuXG5jb250ZW50U3BhY2UucmVwbGFjZUNoaWxkcmVuKC4uLmF3YWl0IFByb21pc2UuYWxsKFtta1dpbmRvdygxKSwgbWtXaW5kb3coKV0pKVxuIgogIF0sCiAgIm1hcHBpbmdzIjogIjtBQUVPLElBQU0sT0FBTyxTQUFTO0FBRTdCLElBQU0sZUFBZTtBQUFBLEVBQ25CLE9BQU07QUFBQSxJQUNKLE9BQW1CO0FBQUEsSUFDbkIsWUFBbUI7QUFBQSxJQUNuQixLQUFtQjtBQUFBLElBQ25CLE9BQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsTUFBSztBQUFBLElBQ0gsT0FBbUI7QUFBQSxJQUNuQixZQUFtQjtBQUFBLElBQ25CLEtBQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLElBQ25CLE9BQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLEVBQ3JCO0FBQ0Y7QUFFTyxJQUFNLFFBQVE7QUFBQSxFQUNuQixPQUFPO0FBQUEsRUFDUCxZQUFZO0FBQUEsRUFDWixNQUFNO0FBQUEsRUFDTixXQUFXO0FBQUEsRUFD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QUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUFBLE1BQzNDLFVBQVUsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUFBLE1BQ3RELFdBQVcsR0FBRyxJQUFJLEVBQUUsSUFBSSxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQUEsTUFDcEMsVUFBVSxJQUFJLFNBQVMsS0FBSyxJQUFJLENBQUM7QUFBQSxNQUNqQyxPQUFPLGNBQWEsS0FBSyxlQUFlLFdBQVcsV0FBVyxHQUM1RCxDQUFDLFNBQVMsR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsUUFBUSxHQUFHLElBQUksRUFBRSxJQUFJLFNBQVMsQ0FBQyxHQUN6RDtBQUFBLFFBQ0UsVUFBVSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQUEsUUFDdEQsVUFBVSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQUEsUUFDM0MsVUFBVSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxLQUFLLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFBQSxRQUNyRCxVQUFVLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEtBQUssU0FBUyxHQUFHLEtBQUssQ0FBQztBQUFBLFFBQ3JELFdBQVcsR0FBRyxJQUFJLEVBQUUsSUFBSSxLQUFLO0FBQUEsTUFDL0IsQ0FDRjtBQUFBLElBQ0Y7QUFBQSxHQUNEO0FBQUEsRUFFRCxNQUFNLGNBQWMsS0FBSyxDQUFDLEtBQUssR0FBRyxRQUFRLGlCQUFlO0FBQUEsSUFDdkQsTUFBTSxNQUFNLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLEtBQUssR0FBRyxPQUFP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YyxJQUFJLEdBQUcsVUFBVSxJQUFJLEdBQUcsRUFBRTtBQUFBLElBQ25FLE9BQU8sT0FBTztBQUFBLElBQ2QsUUFBUSxLQUFLLGdGQUFnRixLQUFLO0FBQUEsSUFDbEcsT0FBTyxhQUFhLGNBQWMsSUFBSSxHQUFHLFVBQVUsSUFBSSxDQUFDO0FBQUE7QUFBQTtBQUlyRCxJQUFJLFNBQVMsTUFBTSxjQUFjO0FBVWpDLElBQUksY0FBYyxXQUEwQixDQUFDLENBQUU7QUFpQnRELE1BQU0sVUFBVSxNQUFNO0FBRXRCLGVBQWUsUUFBUyxDQUFDLE1BQWMsR0FBSTtBQUFBLEVBRXpDLElBQUksWUFBWTtBQUFBLElBQ2QsQ0FBQyxPQUFPLFFBQVEsTUFBTSxDQUFDO0FBQUEsSUFDdkIsQ0FBQyxXQUFXLE1BQU0sWUFBWSxNQUFNLENBQUM7QUFBQSxJQUNyQyxDQUFDLFFBQVEsU0FBUyxNQUFNLENBQUM7QUFBQSxFQUMzQjtBQUFBLEVBRUEsTUFBTSxLQUFLLElBQUksTUFBTTtBQUFBLElBQ25CLE1BQU07QUFBQSxJQUNOLFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSLFFBQVEsZUFBYSxNQUFNO0FBQUEsSUFDM0IsVUFBVTtBQUFBLElBQ1YsU0FBUztBQUFBLElBQ1QsZUFBZTtBQUFBLEVBQ2pCLENBQUMsQ0FBQztBQUFBLEVBRUYsU0FBUyxPQUFPLENBQUMsTUFBa0M7QUFBQSxJQUNqRCxNQUFNLE9BQU8sRUFDWCxNQUFNO0FBQUEsTUFDSixRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsTUFDVCxNQUFNO0FBQUEsSUFDUixDQUFDLEdBQ0QsVUFBVSxJQUFJLEVBQUUsR0FBRSxPQUNoQixLQUFNLEdBQ0osTUFBSSxRQUFRLENBQUMsR0FDYixNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixRQUFRLGdCQUFlLEtBQUcsT0FBTSxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ3BELE9BQVEsS0FBRyxPQUFPLE1BQU0sUUFBUSxNQUFNO0FBQUEsSUFDeEMsQ0FBQyxDQUNILENBQ0YsQ0FDRjtBQUFBLElBRUEsTUFBTSxVQUFVLElBQ2QsTUFBTTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sV0FBVztBQUFBLE1BQ1gsVUFBVTtBQUFBLElBQ1osQ0FBQyxHQUNELFVBQVUsS0FBSyxFQUFFLE9BQU0sS0FBRyxJQUFHLEVBQUcsRUFDbEM7QUFBQSxJQUVBLEdBQUcsZ0JBQ0QsTUFDQSxPQUNGO0FBQUE7QUFBQSxFQUdGLFFBQVEsVUFBVSxLQUFNLEVBQUU7QUFBQSxFQUUxQixPQUFPO0FBQUE7QUFHVCxhQUFhLGdCQUFnQixHQUFHLE1BQU0sUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQzsiLAogICJkZWJ1Z0lkIjogIkVDODQ1MkRERDYwNDZDQUI2NDc1NkUyMTY0NzU2RTIxIiwKICAibmFtZXMiOiBbXQp9
