graf = d3.select('#graf')
ancho_total = graf.style('width').slice(0, -2)
alto_total  = ancho_total * 0.5625
margins = {
  top: 50,
  left: 100,
  right: 20,
  bottom: 40
}
ancho = ancho_total - margins.left - margins.right
alto  = alto_total - margins.top - margins.bottom

// Area total de visualización
svg = graf.append('svg')
          .style('width', `${ ancho_total }px`)
          .style('height', `${ alto_total }px`)

// Contenedor "interno" donde van a estar los gráficos
g = svg.append('g')
        .attr('transform', `translate(${ margins.left }, ${ margins.top })`)
        .attr('width', ancho + 'px')
        .attr('height', alto + 'px')

// Escaladores
x = d3.scaleTime().range([0, ancho])
y = d3.scaleLinear().range([alto, 0])
//Definiendo las categorias a mostrar
color = d3.scaleOrdinal()
          .domain(['Muertos', 'Contagiados', 'Vacunados'])
          .range(['black','red', 'green'])

// Ejes
xAxisCall = d3.axisBottom().tickFormat(d3.timeFormat("%b' %y"))
xAxis = g.append('g')
          .attr('class', 'ejes')
          .attr('transform', `translate(0, ${alto})`)
yAxisCall = d3.axisLeft()
yAxis = g.append('g')
          .attr('class', 'ejes')

// Generador de líneas
lineaGen = d3.line()
              .x(d => x(d.date))
              .y(d => y(d.value))

// Tooltip que muestra el valor de sobre el area en la que se pone el mouse
let tooltip = d3.select('#tooltip')
linea = g.append('path')
  .on('mouseover', function() {
    tooltip.transition()
        .duration(500)
        .style('opacity', .9)
  })
  .on('mouseout', function() {
    tooltip.transition()        
        .duration(1000)      
        .style("opacity", 0);

  })
  .on('mousemove', function(d) {
    let regex = /[ML](\d+\.*\d*),/g
    let str = d.srcElement.attributes.d.value
    let arr = str.match(regex)
    arr.forEach((d, i) => {
      arr[i] = d.slice(1, d.length - 1)
    })
    let values = d.srcElement.attributes.info.value.split(',')  
    for(let i = 0; i < arr.length; i ++) {
      if(arr[i] > d.x - margins.left - 16.82396039604 && arr[i] <= d.x - margins.left - 15.82396039604) {
        show = values[i]
        tooltip.select('text').text(show)
        tooltip.append('text')
        tooltip.attr('information', show)
        tooltip.attr('class', 'tooltip_text')
        break
      }
    }
  })

// parser para fechas
parser = d3.timeParse(d3.timeParse('%Y-%m-%d'))

function load(symbol='Muertos', country='Mexico') {
  // Carga el database directamente del proyecto, esto hace que se actualice en diario con los nuevos datos.
  let covidData = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.json'

  //Define el top 10 de paises con mas muertos por COVID
  d3.json(covidData)
  .then((data, error) => {
      if (error) {
          console.log(error) 
      } else {
        const countries = {
          USA: data.USA.data,
          Brazil: data.BRA.data,
          Mexico: data.MEX.data,
          India: data.IND.data,
          UK: data.GBR.data,
          Italy: data.ITA.data,
          France: data.FRA.data,
          Russia: data.RUS.data,
          Germany: data.DEU.data,
          Spain: data.ESP.data
        }

        data = countries[country]
        console.log(countries)

        let value = 0

        for(let i = 0; i < data.length; i++) {
          let d = data[i]
          vacc = d.people_fully_vaccinated
          if(vacc) {
            value  = vacc
          }
          let result = {
            date: d.date,
            Contagiados: d.total_cases || 0,
            Muertos: d.total_deaths || 0,
            Vacunados: d.people_fully_vaccinated || value
          }
          data[i] = result
        }

        //Este comando reinicia los ticks del eje X, esto porque se modifican al mostrar la variable de vacunados
        xAxisCall.ticks()

        // Define la fecha de inicio de la variable dada, si se quisiera mostrar una fecha de inicio
        // diferente para otra categoria, solo basta con introducir la variable correspondiente
        if(symbol == 'Vacunados') {
          // Define la fecha desde la que inicia a contar el numero de vacunados:
          let startDate = '2020-12-01'
          let i = 0
          while(data[i].date < startDate) {
            data.shift()
          }
          // Cambia los ticks del eje X a solo 3 ya que las vacunaciones iniciaron en diciembre
          // esto se modificara conforme vayan pasando mas meses para que se siga dividiendo por mes
          xAxisCall.ticks(3)
        }

        for(let i = 0; i < data.length; i++) {
          let result = {
            date: data[i].date,
            value: data[i][symbol]
          }
          data[i] = result
        }

        data.forEach(d => {
          d.value = +d.value
          d.date = parser(d.date)
        })
        console.log(data)
    
        x.domain(d3.extent(data, d => d.date))

    
        y.domain(d3.extent(data, d => d.value))
    
        // Ejes
        xAxis.transition()
              .duration(500)
              .call(xAxisCall.scale(x))
        yAxis.transition()
              .duration(500)
              .call(yAxisCall.scale(y))
    
        render(data, symbol)
      }
  })
}

function render(data, symbol) {
  linea.attr('fill', 'none')
        .attr('stroke-width', 3)
        .transition()
        .duration(250)
        // Añadiendo transicion en la linea:
        .style('opacity', 0)
        .transition()
        .duration(10)
        .attr('stroke', color(symbol))
        .attr('d', lineaGen(data))
        // Informacion del tooltip:
        .attr('info', data.map((d) => d.value))
        // Finalizando transicion:
        .transition()
        .duration(250)
        .style('opacity', 1)

}

load()

function cambio() {
  load(d3.select('#tipo').node().value, d3.select('#country').node().value)
}