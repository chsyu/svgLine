function setSVGPath(svg, points) {
   var distancePath = svg.append('path')
      .attr('fill', 'none')
      .attr('stroke', 'none').node();
   var source;
   var target;
   var gap = 100;
   var totalDistance = 0;
   _.each(points, function (target) {
      if (!source) {
         target.d = 'M' + target.x + ',' + target.y;
      } else {
         if (source.y > target.y - gap) { 
            // if they're sufficiently close to each other
            if (source.x === target.x) { // scroll on a straight line
               target.d += drawLine(target.x, target.y);
               setDistance(source, target);
            } else { // not scroll on a straight line
               target.d += drawLine(target.x, target.y);
               setDistance(source, target);
               target.y1 = target.y - source.y;
               target.interpolate1 = d3.interpolate(0, target.distance);
            }
         } else {
            target.d = drawLine(target.x, target.y);
            target.y2 = target.y - (target.y1 || 0);
            setDistance(source, target);
         }
         target.totalDistance = (totalDistance += target.distance);

      }
      source = target;
   });
   var path = svg.append('path')
      .attr('d', _.pluck(points, 'd').join(' '))
      .attr('fill-opacity', 0)
      .attr('stroke', '#3FB8AF')
      .attr('stroke-dasharray', '20')
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', totalDistance)
      .attr('stroke-dashoffset', totalDistance);
   window.addEventListener('scroll', _.throttle(windowScroll, 200));
   function windowScroll() {
      console.log(scrollY);
      var top = scrollY + 400;
      var source;
      var target = _.find(points, function (point) {
         if (point.y >= top) {
            return true;
         }
         source = point;
         return false;
      });
      if (source && target) {
         var distance = 0;
         var distanceFromSource = top - source.y;
         if (!target.interpolate1) {
            // if there's no interpolate1
            if (!target.interpolate2) {
               // and there's no interpolate2, must mean it's a straight line
               distance = distanceFromSource + (source.totalDistance || 0);
            } else {
               // if there's a interpolate2, must mean there's a straight line
               // and then a curve at the end, so figure out if we're in straight line or curve part
               if (distanceFromSource <= target.y2) {
                  // it's in straight line part
                  distance = distanceFromSource + (source.totalDistance || 0);
               } else {
                  // if it's in last curve part, first interpolate the curve
                  // and then add that back to the straight part and the previous total distance
                  var partialDistance = (distanceFromSource - target.y2) / target.y3;
                  distance = target.interpolate2(partialDistance) + target.y2 + (source.totalDistance || 0);
               }
            }
         } else { //if (!target.interpolate1)
            // if there's interpolate1, must mean there's a first curve
            if (distanceFromSource <= target.y1) {
               // so if it's within the first curve, interpolate that and add it to total distance
               var partialDistance = distanceFromSource / target.y1;
               distance = target.interpolate1(partialDistance) + (source.totalDistance || 0);
            } else if (distanceFromSource <= (target.y1 + target.y2)) {
               // if we're in line part, add curve to it
               distance = target.interpolate1(1) + (distanceFromSource - target.y1) + (source.totalDistance || 0);
            } else if (interpolate2) {
               var partialDistance = (distanceFromSource - target.y2 - target.y1) / target.y3;
               distance = target.interpolate1(1) + target.y2 + target.interpolate2(partialDistance);
            }
         } //if (!target.interpolate1)
         // var partialDistance = (top - source.y) / (target.y - source.y);
         // var distance = target.interpolater(partialDistance) + source.totalDistance;
         console.log(`totalDistance=${totalDistance}, distance=${distance}`);
         path.transition().duration(200)
            .attr('stroke-dashoffset', totalDistance - (distance || 0));
      } // if (source && target) 

   }; // function windowScroll
   function drawLine(x, y) {
      return 'L' + x + ',' + y;
   }
   function setDistance(source, target) {
      var distancePathD = 'M' + source.x + ',' + source.y + ' ' + target.d;
      distancePath.setAttribute('d', distancePathD);
      target.distance = parseFloat(distancePath.getTotalLength().toFixed(2));
   }
}
