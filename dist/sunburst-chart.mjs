import { select } from 'd3-selection';
import { scaleLinear, scalePow } from 'd3-scale';
import { hierarchy, partition } from 'd3-hierarchy';
import { arc } from 'd3-shape';
import { path } from 'd3-path';
import { interpolate } from 'd3-interpolate';
import { transition } from 'd3-transition';
import Kapsule from 'kapsule';
import accessorFn from 'accessor-fn';
import Tooltip from 'float-tooltip';

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;
  if (!css || typeof document === 'undefined') {
    return;
  }
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';
  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".sunburst-viz .slice path {\r\n  cursor: pointer;\r\n}\r\n\r\n.sunburst-viz text {\r\n  dominant-baseline: middle;\r\n  text-anchor: middle;\r\n  pointer-events: none;\r\n  fill: #222;\r\n}\r\n\r\n.sunburst-viz .text-contour {\r\n  fill: none;\r\n  /* stroke: red;\r\n  stroke-linejoin: 'round'; */\r\n}\r\n\r\n.sunburst-viz .main-arc {\r\n  stroke-width: 1px;\r\n  transition: opacity .4s;\r\n}\r\n\r\n.sunburst-viz .main-arc:hover {\r\n  opacity: 0.85;\r\n  transition: opacity .05s;\r\n}\r\n\r\n.sunburst-viz .hidden-arc {\r\n  fill: none;\r\n}\r\n\r\n.sunburst-viz .tooltip {\r\n  max-width: 320px;\r\n  white-space: nowrap;\r\n}\r\n\r\n.sunburst-viz .tooltip-title {\r\n  font-weight: bold;\r\n  text-align: center;\r\n  margin-bottom: 5px;\r\n}\r\n\r\n.sunburst-viz {\r\n  position: relative;\r\n}\r\n";
styleInject(css_248z);

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var measureTextWidth = function measureTextWidth(text) {
  var fontSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
    _ref$strokeWidth = _ref.strokeWidth,
    strokeWidth = _ref$strokeWidth === void 0 ? 1 : _ref$strokeWidth,
    _ref$fontFamily = _ref.fontFamily,
    fontFamily = _ref$fontFamily === void 0 ? 'sans-serif' : _ref$fontFamily;
  var ctx = new OffscreenCanvas(0, 0).getContext('2d');
  if (!ctx) return 0;
  ctx.font = "".concat(fontSize, "px ").concat(fontFamily);
  return ctx.measureText(text).width + strokeWidth;
};

var TEXT_FONTSIZE = 12;
var TEXT_STROKE_WIDTH = 5;
var sunburst = Kapsule({
  props: {
    width: {
      "default": window.innerWidth
    },
    height: {
      "default": window.innerHeight
    },
    data: {
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    children: {
      "default": 'children',
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    sort: {
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    label: {
      "default": function _default(d) {
        return d.name;
      }
    },
    labelOrientation: {
      "default": 'auto'
    },
    // angular, radial, auto
    size: {
      "default": 'value',
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    color: {
      "default": function _default(d) {
        return 'lightgrey';
      }
    },
    strokeColor: {
      "default": function _default(d) {
        return 'white';
      }
    },
    nodeClassName: {},
    // Additional css classes to add on each slice node
    minSliceAngle: {
      "default": .2
    },
    maxLevels: {},
    excludeRoot: {
      "default": false,
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    centerRadius: {
      "default": 0.1
    },
    radiusScaleExponent: {
      "default": 0.5
    },
    // radius decreases quadratically outwards to preserve area
    showLabels: {
      "default": true
    },
    handleNonFittingLabel: {},
    tooltipContent: {
      "default": function _default(d) {
        return '';
      },
      triggerUpdate: false
    },
    tooltipTitle: {
      "default": null,
      triggerUpdate: false
    },
    showTooltip: {
      "default": function _default(d) {
        return true;
      },
      triggerUpdate: false
    },
    focusOnNode: {
      onChange: function onChange(d, state) {
        if (d && state.initialised) {
          moveStackToFront(d.__dataNode);
        }
        function moveStackToFront(elD) {
          state.svg.selectAll('.slice').filter(function (d) {
            return d === elD;
          }).each(function (d) {
            this.parentNode.appendChild(this);
            if (d.parent) {
              moveStackToFront(d.parent);
            }
          });
        }
      }
    },
    onClick: {
      triggerUpdate: false
    },
    onHover: {
      triggerUpdate: false
    },
    transitionDuration: {
      "default": 750,
      triggerUpdate: false
    }
  },
  methods: {
    _parseData: function _parseData(state) {
      if (state.data) {
        var hierData = hierarchy(state.data, accessorFn(state.children)).sum(accessorFn(state.size));
        if (state.sort) {
          hierData.sort(state.sort);
        }
        partition().padding(0)(hierData);
        if (state.excludeRoot) {
          // re-scale y values if excluding root
          var yScale = scaleLinear().domain([hierData.y1 - hierData.y0, 1]);
          hierData.descendants().forEach(function (d) {
            d.y0 = yScale(d.y0);
            d.y1 = yScale(d.y1);
          });
        }
        hierData.descendants().forEach(function (d, i) {
          d.id = i; // Mark each node with a unique ID
          d.data.__dataNode = d; // Dual-link data nodes
        });

        state.layoutData = hierData.descendants();
      }
    }
  },
  aliases: {
    onNodeClick: 'onClick'
  },
  init: function init(domNode, state) {
    var _this = this;
    state.chartId = Math.round(Math.random() * 1e12); // Unique ID for DOM elems

    state.radiusScale = scalePow();
    state.angleScale = scaleLinear().domain([0, 10]) // For initial build-in animation
    .range([0, 2 * Math.PI]).clamp(true);
    state.arc = arc().startAngle(function (d) {
      return state.angleScale(d.x0);
    }).endAngle(function (d) {
      return state.angleScale(d.x1);
    }).innerRadius(function (d) {
      return Math.max(0, state.radiusScale(d.y0));
    }).outerRadius(function (d) {
      return Math.max(0, state.radiusScale(d.y1));
    });
    var el = select(domNode).append('div').attr('class', 'sunburst-viz');
    state.svg = el.append('svg');
    state.canvas = state.svg.append('g').style('font-family', 'sans-serif').style('font-size', "".concat(TEXT_FONTSIZE, "px"));
    state.tooltip = Tooltip()(el);

    // Reset focus by clicking on canvas
    state.svg.on('click', function (ev) {
      return (state.onClick || _this.focusOnNode)(null, ev);
    }) // By default reset zoom when clicking on canvas
    .on('mouseover', function (ev) {
      return state.onHover && state.onHover(null, ev);
    });
  },
  update: function update(state) {
    var _this2 = this;
    if (state.needsReparse) {
      this._parseData();
      state.needsReparse = false;
    }
    var maxRadius = Math.min(state.width, state.height) / 2;
    state.radiusScale.range([maxRadius * Math.max(0, Math.min(1, state.centerRadius)), maxRadius]);
    state.radiusScaleExponent > 0 && state.radiusScale.exponent(state.radiusScaleExponent);
    state.svg.style('width', state.width + 'px').style('height', state.height + 'px').attr('viewBox', "".concat(-state.width / 2, " ").concat(-state.height / 2, " ").concat(state.width, " ").concat(state.height));
    if (!state.layoutData) return;
    var focusD = state.focusOnNode && state.focusOnNode.__dataNode.y0 >= 0 && state.focusOnNode.__dataNode || {
      x0: 0,
      x1: 1,
      y0: 0,
      y1: 1
    };
    var slice = state.canvas.selectAll('.slice').data(state.layoutData.filter(function (d) {
      return (
        // Show only slices with a large enough angle and within the max levels
        d.x1 > focusD.x0 && d.x0 < focusD.x1 && (d.x1 - d.x0) / (focusD.x1 - focusD.x0) > state.minSliceAngle / 360 && (!state.maxLevels || d.depth - (focusD.depth || (state.excludeRoot ? 1 : 0)) < state.maxLevels) && (d.y0 >= 0 || focusD.parent)
      );
    } // hide negative layers on top level
    ), function (d) {
      return d.id;
    });
    var nameOf = accessorFn(state.label);
    var colorOf = accessorFn(state.color);
    var strokeColorOf = accessorFn(state.strokeColor);
    var nodeClassNameOf = accessorFn(state.nodeClassName);
    var transition$1 = transition().duration(state.transitionDuration);
    var levelYDelta = state.layoutData[0].y1 - state.layoutData[0].y0;
    var maxY = Math.min(1, focusD.y0 + levelYDelta * Math.min(focusD.hasOwnProperty('height') ? focusD.height + 1 : Infinity, state.maxLevels || Infinity));

    // Apply zoom
    state.svg.transition(transition$1).tween('scale', function () {
      var xd = interpolate(state.angleScale.domain(), [focusD.x0, focusD.x1]);
      var yd = interpolate(state.radiusScale.domain(), [focusD.y0, maxY]);
      return function (t) {
        state.angleScale.domain(xd(t));
        state.radiusScale.domain(yd(t));
      };
    });

    // Exiting
    var oldSlice = slice.exit().transition(transition$1).remove();
    oldSlice.select('path.main-arc').attrTween('d', function (d) {
      return function () {
        return state.arc(d);
      };
    });
    oldSlice.select('path.hidden-arc').attrTween('d', function (d) {
      return function () {
        return middleArcLine(d);
      };
    });

    // Entering
    var newSlice = slice.enter().append('g').style('opacity', 0).on('click', function (ev, d) {
      ev.stopPropagation();
      (state.onClick || _this2.focusOnNode)(d.data, ev);
    }).on('mouseover', function (ev, d) {
      ev.stopPropagation();
      state.onHover && state.onHover(d.data, ev);
      state.tooltip.content(!!state.showTooltip(d.data, d) && "<div class=\"tooltip-title\">".concat(state.tooltipTitle ? state.tooltipTitle(d.data, d) : getNodeStack(d).slice(state.excludeRoot ? 1 : 0).map(function (d) {
        return nameOf(d.data);
      }).join(' &rarr; '), "</div>").concat(state.tooltipContent(d.data, d)));
    }).on('mouseout', function () {
      return state.tooltip.content(false);
    });
    newSlice.append('path').attr('class', 'main-arc').style('stroke', function (d) {
      return strokeColorOf(d.data, d.parent);
    }).style('fill', function (d) {
      return colorOf(d.data, d.parent);
    });
    newSlice.append('path').attr('class', 'hidden-arc').attr('id', function (d) {
      return "hidden-arc-".concat(state.chartId, "-").concat(d.id);
    });

    // angular label
    var angularLabel = newSlice.append('text').attr('class', 'angular-label');

    // Add white contour
    angularLabel.append('textPath').attr('class', 'text-contour').attr('startOffset', '50%').attr('xlink:href', function (d) {
      return "#hidden-arc-".concat(state.chartId, "-").concat(d.id);
    });
    angularLabel.append('textPath').attr('class', 'text-stroke').attr('startOffset', '50%').attr('xlink:href', function (d) {
      return "#hidden-arc-".concat(state.chartId, "-").concat(d.id);
    });

    // radial label
    var radialLabel = newSlice.append('g').attr('class', 'radial-label');
    radialLabel.append('text').attr('class', 'text-contour'); // white contour
    radialLabel.append('text').attr('class', 'text-stroke');

    // white contour
    newSlice.selectAll('.text-contour').style('stroke-width', "".concat(TEXT_STROKE_WIDTH, "px"));

    // Entering + Updating
    var allSlices = slice.merge(newSlice);
    allSlices.style('opacity', 1).attr('class', function (d) {
      return ['slice'].concat(_toConsumableArray("".concat(nodeClassNameOf(d.data) || '').split(' ').map(function (str) {
        return str.trim();
      }))).filter(function (s) {
        return s;
      }).join(' ');
    });
    allSlices.select('path.main-arc').transition(transition$1).attrTween('d', function (d) {
      return function () {
        return state.arc(d);
      };
    }).style('stroke', function (d) {
      return strokeColorOf(d.data, d.parent);
    }).style('fill', function (d) {
      return colorOf(d.data, d.parent);
    });
    var computeAngularLabels = state.showLabels && ['angular', 'auto'].includes(state.labelOrientation.toLowerCase());
    var computeRadialLabels = state.showLabels && ['radial', 'auto'].includes(state.labelOrientation.toLowerCase());
    if (computeAngularLabels) {
      allSlices.select('path.hidden-arc').transition(transition$1).attrTween('d', function (d) {
        return function () {
          return middleArcLine(d);
        };
      });
    }

    // Ensure propagation of data to labels children
    allSlices.select('text.angular-label').select('textPath.text-contour');
    allSlices.select('text.angular-label').select('textPath.text-stroke');
    allSlices.select('g.radial-label').select('text.text-contour');
    allSlices.select('g.radial-label').select('text.text-stroke');

    // Label processing
    var getLabelMeta = function getLabelMeta(d) {
      if (!state.showLabels) return {
        label: '',
        fits: false
      };
      var isRadial = (state.labelOrientation === 'auto' ? autoPickLabelOrientation(d) : state.labelOrientation) !== 'angular';
      var label = nameOf(d.data);
      var fits = isRadial ? radialTextFits(d) : angularTextFits(d);
      if (!fits && state.handleNonFittingLabel) {
        var availableSpace = isRadial ? getAvailableLabelRadialSpace(d) : getAvailableLabelAngularSpace(d);
        var newLabel = state.handleNonFittingLabel(label, availableSpace, d);
        if (newLabel) {
          label = newLabel;
          fits = true;
        }
      }
      return {
        isRadial: isRadial,
        label: label,
        fits: fits
      };
    };
    var labelMetaCache = new Map();

    // Show/hide labels
    allSlices.select('.angular-label').transition(transition$1).styleTween('display', function (d) {
      return function () {
        labelMetaCache.set(d, getLabelMeta(d)); // cache label settings

        var _labelMetaCache$get = labelMetaCache.get(d),
          isRadial = _labelMetaCache$get.isRadial,
          fits = _labelMetaCache$get.fits;
        return computeAngularLabels && !isRadial && fits ? null : 'none';
      };
    });
    allSlices.select('.radial-label').transition(transition$1).styleTween('display', function (d) {
      return function () {
        var _labelMetaCache$get2 = labelMetaCache.get(d),
          isRadial = _labelMetaCache$get2.isRadial,
          fits = _labelMetaCache$get2.fits;
        return computeRadialLabels && isRadial && fits ? null : 'none';
      };
    });

    // Set labels
    computeAngularLabels && allSlices.selectAll('text.angular-label').selectAll('textPath').transition(transition$1).textTween(function (d) {
      return function () {
        return labelMetaCache.get(d).label;
      };
    });
    computeRadialLabels && allSlices.selectAll('g.radial-label').selectAll('text').transition(transition$1).textTween(function (d) {
      return function () {
        return labelMetaCache.get(d).label;
      };
    }).attrTween('transform', function (d) {
      return function () {
        return radialTextTransform(d);
      };
    });

    //

    function middleArcLine(d) {
      var halfPi = Math.PI / 2;
      var angles = [state.angleScale(d.x0) - halfPi, state.angleScale(d.x1) - halfPi];
      var r = Math.max(0, (state.radiusScale(d.y0) + state.radiusScale(d.y1)) / 2);
      if (!r || !(angles[1] - angles[0])) return '';
      var middleAngle = (angles[1] + angles[0]) / 2;
      var invertDirection = middleAngle > 0 && middleAngle < Math.PI; // On lower quadrants write text ccw
      if (invertDirection) {
        angles.reverse();
      }
      var path$1 = path();
      path$1.arc(0, 0, r, angles[0], angles[1], invertDirection);
      return path$1.toString();
    }
    function radialTextTransform(d) {
      var middleAngle = (state.angleScale(d.x0) + state.angleScale(d.x1) - Math.PI) / 2;
      var r = Math.max(0, (state.radiusScale(d.y0) + state.radiusScale(d.y1)) / 2);
      var x = r * Math.cos(middleAngle);
      var y = r * Math.sin(middleAngle);
      var rot = middleAngle * 180 / Math.PI;
      middleAngle > Math.PI / 2 && middleAngle < Math.PI * 3 / 2 && (rot += 180); // prevent upside down text

      return "translate(".concat(x, ", ").concat(y, ") rotate(").concat(rot, ")");
    }
    function getAvailableLabelAngularSpace(d) {
      var deltaAngle = state.angleScale(d.x1) - state.angleScale(d.x0);
      var r = Math.max(0, (state.radiusScale(d.y0) + state.radiusScale(d.y1)) / 2);
      return r * deltaAngle;
    }
    function getAvailableLabelRadialSpace(d) {
      return state.radiusScale(d.y1) - state.radiusScale(d.y0);
    }
    function angularTextFits(d) {
      return measureTextWidth(nameOf(d.data).toString(), TEXT_FONTSIZE, {
        strokeWidth: TEXT_STROKE_WIDTH
      }) < getAvailableLabelAngularSpace(d);
    }
    function radialTextFits(d) {
      var availableHeight = state.radiusScale(d.y0) * (state.angleScale(d.x1) - state.angleScale(d.x0));
      if (availableHeight < TEXT_FONTSIZE + TEXT_STROKE_WIDTH) return false; // not enough angular space

      return measureTextWidth(nameOf(d.data).toString(), TEXT_FONTSIZE, {
        strokeWidth: TEXT_STROKE_WIDTH
      }) < getAvailableLabelRadialSpace(d);
    }
    function autoPickLabelOrientation(d) {
      // prefer mode that keeps text most horizontal
      var angle = (state.angleScale(d.x0) + state.angleScale(d.x1)) / 2 % Math.PI;
      var preferRadial = angle > Math.PI / 4 && angle < Math.PI * 3 / 4;
      var orientation = preferRadial ? radialTextFits(d) ? 'radial' : angularTextFits(d) ? 'angular' : null : angularTextFits(d) ? 'angular' : radialTextFits(d) ? 'radial' : null;
      if (!orientation) {
        var availableArcWidth = state.radiusScale(d.y0) * (state.angleScale(d.x1) - state.angleScale(d.x0));
        if (availableArcWidth < TEXT_FONTSIZE + TEXT_STROKE_WIDTH) {
          // not enough space for radial text, choose angular
          orientation = 'angular';
        } else {
          var angularSpace = getAvailableLabelAngularSpace(d);
          var radialSpace = getAvailableLabelRadialSpace(d);
          orientation = angularSpace < radialSpace ? 'radial' : 'angular';
        }
      }
      return orientation;
    }
    function getNodeStack(d) {
      var stack = [];
      var curNode = d;
      while (curNode) {
        stack.unshift(curNode);
        curNode = curNode.parent;
      }
      return stack;
    }
  }
});

export { sunburst as default };
