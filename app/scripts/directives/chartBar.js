'use strict';

angular.module('cyanogenmodDistributionApp')
  .directive('chartBar', function () {
    return {
      restrict: 'E',
      scope: {
        data: '='
      },
      templateUrl: 'partials/chart-bar',
      link: function(scope, element, attrs) {
        var margin = { top: 50, right: 0, bottom: 90, left: 60 },
            width = element.width() - margin.left - margin.right,
            height = 400,
            barMinWidth = 20,
            formatNumber = d3.format(',');

        var chart = d3.select(element[0])
          .select('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        scope.slider = {
          value: [0.00, 1.00]
        };

        scope.$watch('slider.value', function() {
          updateChart(scope.data);
        });

        scope.$watch('data', function(data) {
          if (!data) {
            return;
          }

          var optimalAmount = Math.floor(width / barMinWidth),
              sliderEnd = optimalAmount / data.length;

          scope.slider.value[1] = sliderEnd;
          updateChart(data);
        });

        var updateChart = function(data) {
          chart.selectAll('*').remove();

          var sliderValue = scope.slider.value,
              start = Math.floor(data.length * sliderValue[0]),
              end = Math.ceil(data.length * sliderValue[1]);

          data = data.slice(start, end);

          var optimalWidth = Math.max(data.length * barMinWidth, width);

          d3.select(element[0])
            .select('svg')
              .attr('width', optimalWidth + margin.left + margin.right);

          var x = d3.scale.ordinal()
              .rangeBands([0, optimalWidth], 0.1, 0.2)
              .domain(data.map(function(d) { return d.name; }));

          var y = d3.scale.linear()
              .domain([0, d3.max(data, function(d) { return d.downloads; })])
              .range([height, 0]);

          var xAxis = d3.svg.axis()
              .scale(x)
              .orient('bottom');

          var yAxis = d3.svg.axis()
              .scale(y)
              .orient('left');

          var bar = chart.selectAll('g')
              .data(data)
            .enter().append('g')
              .attr('transform', function(d) { return 'translate(' + (x(d.name) - 0) + ', 0)'; });

          var colorScale = getColorScale(data);

          bar.append('rect')
              .attr('y', function(d) { return y(d.downloads); })
              .attr('height', function(d) { return height - y(d.downloads); })
              .attr('width', x.rangeBand())
              .style('fill', function(d) { return colorScale(d.version); });

          bar.append('title')
              .text(function(d) { return formatNumber(d.downloads); });

          chart.append('g')
              .attr('class', 'x axis')
              .attr('transform', 'translate(0, ' + height + ')')
              .call(xAxis)
              .selectAll('text')
                  .style('text-anchor', 'end')
                  .attr('dx', '-.8em')
                  .attr('dy', '-.6em')
                  .attr('transform', 'rotate(-90)');

          chart.append('g')
              .attr('class', 'y axis')
              .call(yAxis);
        };

        var getColorScale = function(data) {
          var versions = _.chain(data)
            .map(function(d) { return d.version; })
            .compact()
            .uniq()
            .sortBy()
            .value();
          var color = d3.lab('#4682B4');
          var colorScale = d3.scale.linear()
              .domain([_.min(versions) * 0.9, _.max(versions) * 1.1])
              .range([color.brighter(2), color.darker(2)])
              .interpolate(d3.interpolateLab);

          return function(version) {
            if (version) {
              return colorScale(version);
            } else {
              return '#808080';
            }
          };
        };
      }
    };
  });
