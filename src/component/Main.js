import { useState, useEffect, useRef } from "react";

import './Map.css'
import olMap from 'ol/Map.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { OSM,TileWMS } from 'ol/source.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer, Tile as TileLayer } from 'ol/layer.js';
import { Draw, Select } from 'ol/interaction.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { LineString, Polygon } from "ol/geom.js";
import { getArea, getLength } from 'ol/sphere.js';

import { click } from "ol/events/condition.js";
import { Overlay } from "ol";
import { unByKey } from 'ol/Observable.js';
import { bbox } from 'ol/loadingstrategy.js';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { ChromePicker } from 'react-color';


function Main() {

    const [baseMap, setBaseMap] = useState(null);
    const [measureType, setMeasureType] = useState('');
    const [layerSelect, setLayerSelect] = useState('layer list');
    const [layerType, setLayerType] = useState(null);
    const [vectorStyleBtn, setVectorStyleBtn] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    const [lineColor, setLineColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(1);
    const [polygonColor, setPolygonColor] = useState('#000000');
    const [selectedFeature, setSelectedFeature] = useState([]);

    const addedLayers = useRef([]);

    // 기본 배경 지도 OSM
    useEffect(() => {

            const osmMap = new TileLayer({
                source: new OSM(),
            });

            const source = new VectorSource();

            const vector = new VectorLayer({
                source:source,
                style: {
                    'fill-color': 'rgba(255, 255, 255, 0.2)',
                    'stroke-color': '#ffcc33',
                    'stroke-width': 2,
                    'circle-radius': 7,
                    'circle-fill-color': '#ffcc33',
                },
            });

            const map = new olMap({
                layers: [osmMap, vector],
                target: 'map',
                view: new View({
                    center: [14135461.422264, 4517734.119767],
                    zoom: 11,
                    minZoom: 5.5,
                    maxZoom: 20,
                }),
            });
        
            setBaseMap( map )
            
            // clean up 함수 
            return () => baseMap.setTarget(undefined);  
            
    }, []);
    

    let draw;
    let sketch;
    let measureTooltipElement;
    let measureTooltip;
    let helpTooltipElement;
    let helpTooltip;

    const continuePolygonMsg = 'Click to continue drawing the polygon';
    const continueLineMsg = 'Click to continue drawing the line';

    const pointerMoveHandler = function (evt) {
        if (evt.dragging) {
            return;
        }
        /** @type {string} */
        let helpMsg = 'Click to start drawing';
    
        if (sketch) {
            const geom = sketch.getGeometry();
            if (geom instanceof Polygon) {
                helpMsg = continuePolygonMsg;
            } else if (geom instanceof LineString) {
                helpMsg = continueLineMsg;
            }
        }
    
        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);
        helpTooltipElement.classList.remove('hidden');
    };

    const formatLength = function (line) {
        const length = getLength(line);
        let output;
        if (length > 100) {
          output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km';
        } else {
          output = Math.round(length * 100) / 100 + ' ' + 'm';
        }
        return output;
    };

    const formatArea = function (polygon) {
        const area = getArea(polygon);
        let output;
        if (area > 10000) {
          output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
        } else {
          output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
        }
        return output;
    };

    function createMeasureTooltip() {
        if (measureTooltipElement) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
        measureTooltip = new Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center',
            stopEvent: false,
            insertFirst: false,
        });
        baseMap.addOverlay(measureTooltip);
    }

    function createHelpTooltip() {
        if (helpTooltipElement) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = document.createElement('div');
        helpTooltipElement.className = 'ol-tooltip hidden';
        helpTooltip = new Overlay({
            element: helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left',
        });
        baseMap.addOverlay(helpTooltip);
    }

    const style = new Style({
        fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            lineDash: [10, 10],
            width: 2,
        }),
        image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
                color: 'rgba(0, 0, 0, 0.7)',
            }),
            fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
            }),
        }),
    });

    
    function addInteraction() {
        draw = new Draw({
            source: baseMap.source,
            type: measureType,
            style: function (feature) {
            const geometryType = feature.getGeometry().getType();
            if (geometryType === measureType || geometryType === 'Point') {
                return style;
            }
            },    
        });
        baseMap.addInteraction(draw);
        createMeasureTooltip();
        createHelpTooltip();
        
        let listener;
        draw.on('drawstart', function (evt) {
            sketch = evt.feature;
        
          /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
            let tooltipCoord = evt.coordinate;
        
            listener = sketch.getGeometry().on('change', function (evt) {
            const geom = evt.target;
            let output;
            if (geom instanceof Polygon) {
                output = formatArea(geom);
                tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof LineString) {
                output = formatLength(geom);
                tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
            });
        });
        
        draw.on('drawend', function () {
            measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
            measureTooltip.setOffset([0, -7]);
            // unset sketch
            sketch = null;
            // unset tooltip so that a new one can be created
            measureTooltipElement = null;
            createMeasureTooltip();
            unByKey(listener);

            // 그리기 끝나면 이전 interaction 제거 
            baseMap.removeInteraction(draw);
        });
    }
    
     // 버튼 클릭 시 value(거리, 면적) 값에 따라 setMeasureType
    function measureTypeSelect (e) {
        const type = e.target.value;
        setMeasureType(type);
    }

    useEffect(() => {

        if (baseMap && measureType) {
            createHelpTooltip();
            baseMap.on('pointermove', pointerMoveHandler);
            baseMap.getViewport().addEventListener('mouseout', function () {
                helpTooltipElement.classList.add('hidden');
            });

            addInteraction();
        }

    }, [baseMap, measureType]);

    // selectbox 선택할 경우 해당 value(레이어 목록) 값으로 변경
    const layerSelectChange = (e) => {
        setLayerSelect(e.target.value);
        setLayerType(null); 
    };
    
    // button 클릭 시 지정해준 type(tile, vector)으로 LayerType 변경
    const layerTypeChange = (type) => {
        setLayerType(type); 

        // 기존에 추가된 layer 제거
        if(addedLayers) {
            addedLayers.current.forEach(layer => {
                baseMap.removeLayer(layer);
            });
            // 추가된 레이어 목록 초기화 
            addedLayers.current = [];
        }

    };

    // type에 따른 layer 생성
    useEffect(() => {
        if (baseMap && layerSelect && layerType !== null) {
            
            let layerToAdd = null;

            if (layerType === 'tile') {
                layerToAdd = createTileLayer(layerSelect);
            } else if (layerType === 'vector') {
                layerToAdd = createVectorLayer(layerSelect)
            }
    
            if (layerToAdd) {
                baseMap.addLayer(layerToAdd);
                addedLayers.current.push(layerToAdd);
            }
            
        }
    }, [baseMap, layerSelect, layerType]);

    function createTileLayer(layerSelect) {
        return new TileLayer({
            extent: [14043736.988321789, 4464228.199967377, 14227185.856206212, 4571240.039566623],
            source: new TileWMS({
                url: 'http://127.0.0.1:8080/geoserver/wms',
                params: {
                    'LAYERS': `mission:${layerSelect}`,
                    'TILED': true
                },
                serverType: 'geoserver',
                transition: 0,
            }),
        })
    };
    
    const selected = new Style({
        fill: new Fill({
            color: '#eeeeee',
        }),
        stroke: new Stroke({
            color: '#f00',
            width: 2,
        }),
    });

    function selectStyle(feature) {
        const color = feature.get('COLOR') || '#eeeeee';
        selected.getFill().setColor(color);
        return selected;
    }

    const selectClick = new Select({
        condition: click,
        style: selectStyle,
    });

    selectClick.on('select', (e) => {
        const selectedFeature = e.selected;
        if(selectedFeature.length > 0) {
            setSelectedFeatureId(selectedFeature[0].getId());
            
            setSelectedFeature(selectedFeature);
        } else {
            setSelectedFeatureId(null);
        }

    });

    // ol/source/Vector - VectorSource 부분 참고
    function createVectorLayer(layerSelect) {
        const vectorSource = new VectorSource({
            format: new GeoJSON(),
            loader: function(extent, resolution, projection) {
                const projCode = projection ? projection.getCode() : 'EPSG:3857'; 
                const url = 'http://127.0.0.1:8080/geoserver/ows?service=WFS&' +
                    `version=1.0.0&request=GetFeature&typeName=mission:${layerSelect}&` +
                    `outputFormat=application/json&srsname=` + projCode + '&' + 
                    'bbox=' + extent.join(',') + ',' + projCode;
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url);
                    const onError = function() {
                        vectorSource.removeLoadedExtent(extent);
                    }
                    xhr.onerror = onError;
                    xhr.onload = function() {
                        if (xhr.status == 200) {
                            const features = vectorSource.getFormat().readFeatures(xhr.responseText);
                            vectorSource.addFeatures(features);
                        } else {
                            onError();
                        }
                    }
                    xhr.send();
            },
            strategy: bbox,
        });
        
        const featureOverlay = new VectorLayer({
            source: vectorSource,
        });

        baseMap.on('click', function (e) {
            // selectClick Interaction이 이미 추가가 되어 있는지 확인하고 추가되어 있지 않으면 추가해줌 
            // 이 작업을 해주지 않으면 계속해서 클릭할 때 마다 Interaction이 추가되서? console.log에 피처가 중복으로 찍혔음  => 좀 더 알아봐야함 ..
            if (!baseMap.getInteractions().getArray().includes(selectClick)) {
                baseMap.addInteraction(selectClick);
            }
    
        });

        // 스타일 변경 버튼 활성화
        setVectorStyleBtn(true);

        return featureOverlay;
        
    }

    const handleDialogOpen = () => {
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    
    const lineColorChange = (color) => {
        setLineColor(color);
    }

    const lineWidthChange = (stroke) => {
        setLineWidth(stroke);
    }

    const polygonColorChange = (color) => {
        setPolygonColor(color);
    }

    // 스타일 저장 클릭 시 feature에 적용
    function featureStyleChange() {
        const style = new Style({
            stroke: new Stroke({
                color: lineColor,
                width: lineWidth,
            }),
            fill: new Fill({
                color: polygonColor,
            }),
        });
        
        selectedFeature.forEach(feature => {
            feature.setStyle(style);
        });

        handleDialogClose();
        setVectorStyleBtn(false);
    }

    return (
        <>
        <div id="map" value={baseMap}></div>

        <div id="info">&nbsp;</div>

        <div>
                <button onClick={measureTypeSelect} value='LineString'> 거리 측정 </button>
                <button onClick={measureTypeSelect} value='Polygon'> 면적 측정 </button>

            <label>
                <select onChange={layerSelectChange}>
                    <option value="layer list"> 레이어 목록 </option>
                    <option value="admin_emd"> admin_emd </option>
                    <option value="admin_sgg"> admin_sgg </option>
                    <option value="admin_sid"> admin_sid </option>
                    <option value="river"> river </option>
                    <option value="road_link2"> road_link2 </option>
                    <option value="subway"> subway </option>
                    <option value="subway_station"> subway_station </option>
                </select>
            </label>

            <button onClick={() => layerTypeChange('tile')}> Tile 가져오기 </button>
            <button onClick={() => layerTypeChange('vector')}> Vector 가져오기 </button>

            {vectorStyleBtn && <button onClick={handleDialogOpen}> 스타일 변경 </button>}

            {dialogOpen && (
                <Dialog open={dialogOpen} onClose={handleDialogClose}>
                    <DialogTitle>스타일 변경</DialogTitle>
                    <DialogContent>
                        <span> {selectedFeatureId} </span>

                        <DialogContentText> 선 </DialogContentText>
                        
                        <span> 색상 </span>
                        <input
                            value={lineColor}
                            onChange={e => lineColorChange(e.target.value)}>
                        </input>
                        <ChromePicker
                            color={lineColor}
                            onChange={lineColor => lineColorChange(lineColor.hex)}/>

                        <span> 두께 </span>
                        <input
                            type="number"
                            value={lineWidth}
                            onChange={e => lineWidthChange(e.target.value)}>
                        </input>

                        <DialogContentText> 면 </DialogContentText>

                        <span> 색상 </span>
                        <input
                            value={polygonColor}
                            onChange={e => polygonColorChange(e.target.value)}>
                        </input>
                        <ChromePicker
                            color={polygonColor}
                            onChange={polygonColor => polygonColorChange(polygonColor.hex)}/>

                    </DialogContent>
                    
                    <DialogActions>
                        <Button onClick={featureStyleChange}>저장</Button>
                        <Button onClick={handleDialogClose}> 취소 </Button>
                    </DialogActions>
                </Dialog>
            )}

        </div>

        </>
        )
}

    export default Main;