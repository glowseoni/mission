import { useState, useEffect } from "react";

import './Map.css'
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { OSM,TileWMS } from 'ol/source.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer, Tile as TileLayer } from 'ol/layer.js';
import { Draw } from 'ol/interaction.js';
import { Circle as CircleStyle, Fill, RegularShape, Stroke, Style } from 'ol/style.js';
import { LineString, Polygon } from "ol/geom.js";
import { getArea, getLength } from 'ol/sphere.js';

import { Overlay } from "ol"; 
import { unByKey } from 'ol/Observable.js';
import { bbox } from 'ol/loadingstrategy.js';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { ChromePicker } from 'react-color';
import { click } from "ol/events/condition.js";
import Select from 'ol/interaction/Select.js';

import proj4 from 'proj4';
import { register } from "ol/proj/proj4.js";
import Projection from "ol/proj/Projection.js";
import axios from "axios";

// 좌표계 설정 관련 
proj4.defs([
    ['EPSG:4326', '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'],
    [
        'EPSG:3857',
        '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
    ],
    [
        'EPSG:5173',
        '+proj=tmerc +lat_0=38 +lon_0=125.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs',
    ],
    [
        'EPSG:5174',
        '+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs',
    ],
    [
        'EPSG:5175',
        '+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=550000 +ellps=bessel +units=m +no_defs',
    ],
    [
        'EPSG:5176',
        '+proj=tmerc +lat_0=38 +lon_0=129.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs',
    ],
    [
        'EPSG:5177',
        '+proj=tmerc +lat_0=38 +lon_0=131.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs',
    ],
    [
        'EPSG:5178',
        '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=bessel +units=m +no_defs',
    ],
    [
        'EPSG:5179',
        '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    [
        'EPSG:5180',
        '+proj=tmerc +lat_0=38 +lon_0=125 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    [
        'EPSG:5181',
        '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    [
        'EPSG:5182',
        '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=550000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    [
        'EPSG:5183',
        '+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    [
        'EPSG:5184',
        '+proj=tmerc +lat_0=38 +lon_0=131 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    [
        'EPSG:5185',
        '+proj=tmerc +lat_0=38 +lon_0=125 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    [
        'EPSG:5186',
        '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    [
        'EPSG:5187',
        '+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    [
        'EPSG:5188',
        '+proj=tmerc +lat_0=38 +lon_0=131 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    ],
    ['EPSG:32651', '+proj=utm +zone=51 +ellps=WGS84 +datum=WGS84 +units=m +no_defs'],
    ['EPSG:32652', '+proj=utm +zone=52 +ellps=WGS84 +datum=WGS84 +units=m +no_defs'],
]);

register(proj4);

function Main() {

    const [map, setMap] = useState('');

    const [measureType, setMeasureType] = useState('');
    const [measureTF, setMeasureTF] = useState(0);
    const [layerSelect, setLayerSelect] = useState('');
    const [layerType, setLayerType] = useState('');

    const [addedLayers, setAddedLayers] = useState('');

    const [vectorStyleBtn, setVectorStyleBtn] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [vectorLayerType, setVectorLayerType] = useState('');
    const [lineColor, setLineColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(1);
    const [polygonFillColor, setPolygonFillColor] = useState('#000000');
    const [polygonLineColor, setPolygonLineColor] = useState('#000000');
    const [polygonLineWidth, setPolygonLineWidth] = useState(1);
    const [circleLineColor, setCircleLineColor] = useState('#000000');
    const [circleLineWidth, setCircleLineWidth] = useState(1);
    const [circleFillColor, setCircleFillColor] = useState('#000000');

    const [vectorLayers, setVectorLayers] = useState('');
    const [selectedVectorFeature, setSelectedVectorFeature] = useState('');
    const [selectedFeatureCoordinate, setSelectedFeatureCoordinate] = useState('');
    const [selectedVectorFeatureInfo, setSelectedVectorFeatureInfo] = useState('');

    const [tileFilterBtn, setTileFilterBtn] = useState(false);
    const [inputFilter, setInputFilter] = useState(null);

    const [tileWmsInfo, setTileWmsInfo] = useState(null);
    const [tileWmsSource, setWmsSource] = useState('');

    const projection = new Projection({
        code: "EPSG:3857",
    });

    // 기본 배경 지도 OSM
    useEffect(() => {

        if(!map) {
            const raster = new TileLayer({
                source: new OSM(),
            });

            const container = document.getElementById('popup');

            const infoOverlay = new Overlay({
                element: container,
            });

            const defaultMap = new Map({
                layers: [raster],
                overlays: [infoOverlay],
                target: 'map',
                view: new View({
                    center: [14135461.422264, 4517734.119767],
                    zoom: 11,
                    minZoom: 5.5,
                    maxZoom: 20,
                }),
            },);

            setMap( defaultMap ) 
        }

        return () => {
            if(map) {
                map.dispose();
            }
        };

    },[map]);

    // 버튼 클릭 시 value(lingString, polygon)에 따라 measureType State (거리, 면적)
    function measureTypeSelect (e) {
        setMeasureType(e.target.value);
        setMeasureTF(a => a + 1);
    }

    const source = new VectorSource();

    const measureLayer = new VectorLayer({
        title: 'measure',
        source: source,
        style: {
            'fill-color': 'rgba(255, 255, 255, 0.2)',
            'stroke-color': '#ffcc33',
            'stroke-width': 2,
            'circle-radius': 7,
            'circle-fill-color': '#ffcc33',
        },
    });

    // measure
    useEffect(() => {
        if (map && measureTF) {

            if (addedLayers) {
                addedLayers.forEach(layer => {
                    map.removeLayer(layer);
                });
            }
            setTileFilterBtn(false);
    
            map.on('pointermove', pointerMoveHandler);

            map.getViewport().addEventListener('mouseout', function () {
                if (helpTooltipElement) {
                    helpTooltipElement.classList.add('hidden');
                }
            });

            map.addLayer(measureLayer);
    
            const draw = new Draw({
                source: source,
                type: measureType,
                style: function (feature) {
                    const geometryType = feature.getGeometry().getType();
                    if (geometryType === measureType || geometryType === 'Point') {
                        return style;
                    }
                },    
            });
            map.addInteraction(draw);
    
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
                //debugger;
                measureTooltip.setOffset([0, -7]);
                // unset sketch
                sketch = null;
                // unset tooltip so that a new one can be created
                measureTooltipElement = null;

                unByKey(listener);
                // 그리기 끝나면 이전 interaction 제거 
                map.removeInteraction(draw);

                map.removeOverlay(helpTooltip);
            });
        
        }
    },[map, measureTF]);
    
    // measure 관련 
    let sketch;
    let measureTooltipElement;
    let measureTooltip;
    let helpTooltipElement;
    let helpTooltip;

    const continuePolygonMsg = 'Click to continue drawing the polygon';
    const continueLineMsg = 'Click to continue drawing the line';

    const pointerMoveHandler = function (evt) {
        if (evt.dragging || !helpTooltipElement) {
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
            title: 'measureTooltipOverlay',
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center',
        });
        map.addOverlay(measureTooltip);
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
        map.addOverlay(helpTooltip);
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

    function measureDelete() {
        const measureLayer = map.getLayers().getArray().filter(item => item.get('title') === 'measure');

        measureLayer.forEach(measureLayer => {
            measureLayer.getSource().clear();
        });
        debugger;
        const measureTooltipLayer = map.getOverlays().getArray().filter(item => item.getOptions().title === 'measureTooltipOverlay');
        
        measureTooltipLayer.forEach(measureTooltipLayer => {
            map.removeOverlay(measureTooltipLayer);
        });

    }
    
    // select option 선택 할 경우 해당 value(레이어 목록) 값으로 변경
    const layerSelectChange = (e) => {
        setTileWmsInfo(null);
        setLayerSelect(e.target.value);
        setLayerType(null); 
    };

    // button 클릭 시 지정해준 type(tile, vector)으로 LayerType State (tile, vector)
    const layerTypeChange = (type) => {
        setLayerType(type); 
    };

    // type에 따른 layer 생성
    useEffect(() => {
        if(map && layerSelect && layerType) {

            if (addedLayers) {
                addedLayers.forEach(layer => {
                    map.removeLayer(layer);
                });
            }

            let layerToAdd = null;

            if(layerType === 'tile') {
                layerToAdd = createTileLayer(layerSelect);

                setVectorStyleBtn(false);

                if(layerSelect === 'admin_emd') {
                    setTileFilterBtn(true);
                } else {
                    setTileFilterBtn(false);
                }

            } else if (layerType === 'vector') {
                layerToAdd = createVectorLayer(layerSelect);
                setTileFilterBtn(false);
            }

            // 레이어 배열로 설정해야함 
            setAddedLayers([layerToAdd]);

            map.addLayer(layerToAdd);
        }

    },[map, layerSelect, layerType]);

    // Tile layer 생성 함수
    function createTileLayer(layerSelect, inputFilter) {
        let params = {
            version: '1.3.0',
            'LAYERS': `mission:${layerSelect}`,
            'TILED': true,
        };

        if(inputFilter !== null) {
            params['CQL_FILTER'] = inputFilter;
        }

        const wmsSource = new TileWMS({
            url: 'http://127.0.0.1:8080/geoserver/wms',
            params: params,
            serverType: 'geoserver',
        });

        const tileLayer = new TileLayer({
            extent: [14043736.988321789, 4464228.199967377, 14227185.856206212, 4571240.039566623],
            source: wmsSource,
        });

        setWmsSource(wmsSource);
        
        return tileLayer;
    }

    function inputFilterChange(e) {
        setInputFilter(e.target.value);
    }

    // input 값으로 tileLayer filter 적용 함수 
    function inputFilterApply()  {
        
        if (addedLayers) {
            addedLayers.forEach(layer => {
                map.removeLayer(layer);
            });
        }

        const newLayer = createTileLayer(layerSelect, inputFilter);

        map.addLayer(newLayer);
    
    };

    // WMS 정보 데이터 관련 
    const getWmsData = function (e) {

        const viewResolution = map.getView().getResolution();
        const proj = projection.getCode();

        const url = tileWmsSource.getFeatureInfoUrl(
            e.coordinate,   
            viewResolution,
            proj,
            {'INFO_FORMAT': 'application/json'}
        );

        if (url) {
            axios.get(url).then((response) => {
                if(response.data.features[0] === undefined) {
                    console.log('tile Data 없음')
                } 
                else {
                    setTileWmsInfo(response.data.features[0].properties);
                }
            });
        } 
        
    }

    useEffect(() => {

        if(addedLayers && layerType === 'tile') {
            
            map.on("singleclick", getWmsData);

            return () => {
                map.un("singleclick", getWmsData);
            }
        };
    }, [map, addedLayers, layerType]);


    // Vector layer 생성 함수
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
        
        const vectorOverlay = new VectorLayer({
            source: vectorSource,
        });

        setVectorStyleBtn(true);
        setVectorLayers(vectorOverlay);

        map.on('click', function (e) {
            if (!map.getInteractions().getArray().includes(selectClick)) {
                map.addInteraction(selectClick);
            }
            const coordinate = e.coordinate;

            map.getOverlays().getArray()[0].setPosition(coordinate);
        });

        return vectorOverlay;

    }

    // vector feature 선택 관련
    const selected = 
        new Style({
        fill: new Fill({
            color: '#eeeeee',
        }),
        stroke: new Stroke({
            color: '#f00',
            width: 2,
        }),
    });

    function selectStyle(feature) {
        const color = feature.get('COLOR') || '#f00';
        selected.getFill().setColor(color);
        return selected;
    };

    const selectClick = new Select({
        condition: click,
        style: selectStyle,
    });
    
    const popup = document.getElementById('popup');

    selectClick.on('select', (e) => {
        const selectedFeature = e.selected;
        
        if(selectedFeature.length > 0) {
            setSelectedVectorFeature(selectedFeature);
            setSelectedVectorFeatureInfo(selectedFeature[0].getProperties());
            setSelectedFeatureCoordinate(e.coordinate);

            popup.style.display = 'block';
        } else {
            popup.style.display = 'none';
        }
    });

    function vectorInfoPopupClose() {
        popup.style.display = 'none';
    }

    // 생성되어 있는 vector 레이어의 타입 구분 
    function getVectorLayerType(layer) {
        const layerType = layer.getSource().getFeatures()[0].getGeometry().getType();
        setVectorLayerType(layerType);
    }

    // 모달창이 활성화 될 때 해당 layer의 type을 setState
    const vectorStyleDialogOpen = () => {
        setDialogOpen(true);
        getVectorLayerType(vectorLayers);
    };

    const vectorStyleDialogClose = () => {
        setDialogOpen(false);
    };

    // vectorLayer 스타일 변경 관련
    const lineColorChange = (color) => {
        setLineColor(color);
    }

    const lineWidthChange = (stroke) => {
        setLineWidth(stroke);
    }

    const polygonLineColorChange = (color) => {
        setPolygonLineColor(color);
    }

    const polygonLineWidthChange = (stroke) => {
        setPolygonLineWidth(stroke);
    }

    const polygonFillColorChange = (color) => {
        setPolygonFillColor(color);
    }

    const circleLineColorChange = (color) => {
        setCircleLineColor(color);
    }

    const circleLineWidthChange = (stroke) => {
        setCircleLineWidth(stroke);
    }

    const circleFillColorChange = (color) => {
        setCircleFillColor(color);
    }

    // 스타일 저장 클릭 시 feature에 적용
    function featureStyleChange() {
        let styles = {
            'MultiLineString': new Style({
                stroke: new Stroke({
                    color: lineColor,
                    width: lineWidth,
                }),
            }),
            'MultiPolygon': new Style({
                stroke: new Stroke({
                    color: polygonLineColor,
                    width: polygonLineWidth,
                }),
                fill: new Fill({
                    color: polygonFillColor,
                })
            }),
            'Point': new Style({
                image: new CircleStyle({
                    radius: 5,
                    fill: new Fill({
                        color: circleFillColor,
                    }),
                    stroke: new Stroke({
                        color: circleLineColor,
                        width: circleLineWidth,
                    })
                })
            }),
        }

        const features = vectorLayers.getSource().getFeatures();
        features.forEach(feature => {
            const style = styles[vectorLayerType];
            
            if(style) {
                feature.setStyle(style);
            } else {
                console.log('Vector Layer Style Error');
            }
        })

        vectorStyleDialogClose();
    }

    return (
        <>

        <div id="map" value={map}></div>

        <div className="container">

            <div className="measureBtn">
                <button onClick={measureTypeSelect} value='LineString'> 거리 측정 </button>
                <button onClick={measureTypeSelect} value='Polygon'> 면적 측정 </button>
                <button onClick={measureDelete}> 도형 삭제 </button>
            </div>

            <div className="addItems">
            
                {tileFilterBtn && (
                    <>
                        <input id="wmsInput" type="text" onChange={inputFilterChange}/>
                        <button id="wmsBtn" onClick= {inputFilterApply}> 적용 </button>
                    </>
                )}

                {vectorStyleBtn &&
                    <button onClick={vectorStyleDialogOpen}> 스타일 </button>
                }

            </div>

            <div className="layerCreate">
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
            </div>

            {dialogOpen && (
                <Dialog open={dialogOpen} onClose={vectorStyleDialogClose}>
                    <DialogTitle>스타일 변경</DialogTitle>

                    <DialogContent>
                        {vectorLayerType === 'MultiLineString' && (
                            <>
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
                            </>
                        )}

                        {vectorLayerType === 'MultiPolygon' && (
                            <>
                                <DialogContentText> 선 </DialogContentText>
                        
                                <span> 색상 </span>
                                <input
                                    value={polygonLineColor}
                                    onChange={e => polygonLineColorChange(e.target.value)}>
                                </input>
                                <ChromePicker
                                    color={polygonLineColor}
                                    onChange={polygonLineColor => polygonLineColorChange(polygonLineColor.hex)}/>

                                <span> 두께 </span>
                                <input
                                    type="number"
                                    value={polygonLineWidth}
                                    onChange={e => polygonLineWidthChange(e.target.value)}>
                                </input>

                                <DialogContentText> 면 </DialogContentText>

                                <span> 색상 </span>
                                <input
                                    value={polygonFillColor}
                                    onChange={e => polygonFillColorChange(e.target.value)}>
                                </input>
                                <ChromePicker
                                    color={polygonFillColor}
                                    onChange={polygonFillColor => polygonFillColorChange(polygonFillColor.hex)}/>
                            </>
                        )}

                        {vectorLayerType === 'Point' && (
                            <>
                            <DialogContentText> 선 </DialogContentText>
                    
                            <span> 색상 </span>
                            <input
                                value={circleLineColor}
                                onChange={e => circleLineColorChange(e.target.value)}>
                            </input>
                            <ChromePicker
                                color={circleLineColor}
                                onChange={circleLineColor => circleLineColorChange(circleLineColor.hex)}/>

                            <span> 두께 </span>
                            <input
                                type="number"
                                value={circleLineWidth}
                                onChange={e => circleLineWidthChange(e.target.value)}>
                            </input>

                            <DialogContentText> 면 </DialogContentText>

                            <span> 색상 </span>
                            <input
                                value={circleFillColor}
                                onChange={e => circleFillColorChange(e.target.value)}>
                            </input>
                            <ChromePicker
                                color={circleFillColor}
                                onChange={circleFillColor => circleFillColorChange(circleFillColor.hex)}/>
                        </>
                        )}
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={featureStyleChange}> 저장 </Button>
                        <Button onClick={vectorStyleDialogClose}> 취소 </Button>
                    </DialogActions>

                </Dialog>
            )}

        </div>

        <div id="popup" className="ol-popup">
            <a href="#" id="popup-closer" className="ol-popup-closer" onClick={vectorInfoPopupClose}></a>
                <table>
                    <tbody>
                    {Object.keys(selectedVectorFeatureInfo).map((item, idx) => {
                        if(item.indexOf('geom') === -1){
                        return (
                            <tr key={idx}>
                                <td>{item}</td>
                                <td>{selectedVectorFeatureInfo[item]}</td>
                            </tr>
                        )
                        }
                    })}
                    </tbody>
                </table>
        </div>

        <div className="wmsInfo">
            
            {tileWmsInfo ? (
                <table id="wmsTable">
                <thead>
                    <tr>
                        {Object.keys(tileWmsInfo).map((item, idx) => {
                            return (
                                <th key={idx}>{item}</th>
                            )
                        })}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {Object.values(tileWmsInfo).map((item, idx) => {
                            return (
                                <td key={idx}>{item}</td>
                            )
                        })}
                    </tr>
                </tbody>
            </table>
            ) : null}

            
        </div>


        </>
    )
}

    export default Main;