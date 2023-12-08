import React, { Children, Fragment, cloneElement, memo, useEffect, useState, useRef } from 'react';
import BookIcon from '@material-ui/icons/Book';
import { Grid } from '@mui/material'
import Chip from '@material-ui/core/Chip';
import { useMediaQuery, makeStyles, Button } from '@material-ui/core';
import lodashGet from 'lodash/get';
import jsonExport from 'jsonexport/dist';
import {
    BooleanField,
    BulkDeleteButton,
    BulkExportButton,
    ChipField,
    Datagrid,
    DateField,
    downloadCSV,
    EditButton,
    Filter,
    List,
    NumberField,
    ReferenceArrayField,
    SelectInput,
    Pagination,
    TopToolbar,
    SelectColumnsButton,    
    TextField,
    useRecordContext,
} from 'react-admin'; // eslint-disable-line import/no-unresolved

import ResetViewsButton from './ResetViewsButton';

import { useMap, Map, MapContainer, TileLayer, GeoJSON, LayersControl, Marker, Popup } from "react-leaflet";
import L from "leaflet";
// import "./styles.css";
import "leaflet/dist/leaflet.css";

export const PostIcon = BookIcon;

// 8 - tanker
const colors = ["fe4848", "fe6c58", "fe9068", "feb478", "fed686", "fed686", "fed686", "FF2D00"];

const useStyles = makeStyles(theme => ({
    title: {
        maxWidth: '20em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    hiddenOnSmallScreens: {
        [theme.breakpoints.down('md')]: {
            display: 'none',
        },
    },
    publishedAt: { fontStyle: 'italic' },
}));

function customMarkerIcon(color, vector) {
    const svgTemplate = `
      <svg  xmlns="http://www.w3.org/2000/svg" transform="rotate(${vector})" viewBox="0 0 40 40" class="marker">
        <path 
            fill="#${color}" 
            stroke="#fff"
            d="M0,5L40,17L0,30L10,17zz"
        />
      </svg>`;

    return new L.DivIcon({
        className: "test",
        html: svgTemplate,
        iconSize: [20, 20],
        iconAnchor: [12, 24],
        popupAnchor: [7, -16],
        style: { transform: [{ rotate: '180deg' }] }
        });      
}

const PointMarker = ({ center, content, openPopup, icon }) => {
  const map = useMap();
  // const markerRef = useRef(null);

  useEffect(() => {
    if (openPopup) {
      // map.flyToBounds([center], 14, {
      map.flyTo(center, 12, {
        duration: 2
    });
      // markerRef.current.openPopup();
    }
  // }, [map, center, openPopup]);
  }, [openPopup]);

  return (
    <Marker 
      // ref={markerRef} 
      position={center}
      icon={icon}
    >
      <Popup>{content}</Popup>
    </Marker>
  );
};

const MyMarkers = ({ data }) => {
    return data.map((item, index) => (
      <Marker
        key={index}
        icon={customMarkerIcon(colors[item.type], item.heading)}
        // center={{ lat: item.lat, lng: item.lng }}
        position={{ lat: item.lat, lng: item.lng }}
        // center={{ lat: item.lat, lng: item.lng }}
        // openPopup={selectedIndex === index}
      >
        <Popup>{item.name}</Popup>
      </Marker>
    ));
};

async function fetchDataReal (setMethod, lat, lon, zoom) {
    let fetchUrl = process.env.REACT_APP_API_SERVER_FRONT
    let url = `http://${fetchUrl}/api/v1/back/vehicle/map/ships?c_lat=${lat}&c_lon=${lon}&c_zoom=${zoom}`
    fetch(url)
    .then((response) => {
      // console.log(response)
      // console.log(response.json())
      return response.json()
    }).then((in_json) => {
      let list_ships = in_json.results
      let tabPoints = list_ships.map((curRow, curIndex) => (
        { 
          lat: curRow.lat, 
          lng: curRow.lon,
          heading: curRow.heading,
          name: curRow.name,
          type: curRow.type,
          title: "title" 
        }
        ))
      // console.log(tabPoints)
      console.log("Data updated")
      setMethod(tabPoints)
    })
  }

const GetCoordinates = ({eventChange}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const legend = L.control({ position: "bottomleft" });

    const div = L.DomUtil.create("div", "legend");

    legend.onAdd = () => {
      const { lat, lng } = map.getCenter();
      const zoom = map.getZoom();

      L.DomEvent.disableClickPropagation(div);

      div.innerHTML = `center: ${lat.toFixed(5)}, ${lng.toFixed(
        5
      )} | zoom: ${zoom}`;

      return div;
    };

    legend.addTo(map);

    map.on("dragend zoomend", () => {
      const { lat, lng } = map.getCenter();
      const zoom = map.getZoom();
      fetchDataReal(eventChange, lat, lng, zoom)
      // if (lat >= 52 && lat <= 53 && lng >= 20 && lng <= 22)   {
      //   eventChange(points)
      // }
      div.innerHTML = `center: ${lat.toFixed(5)}, ${lng.toFixed(
        5
      )} | zoom: ${zoom}`;
    });
  }, [map]);

  return null;
};

const position = [44.15615, 28.739, 12];
const newPosition = [40.00, 20.00];

const CoordinasesPosition = ({coordinates}) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([coordinates[0],coordinates[1]], coordinates[2], {
      duration: 2
    });
  }, [coordinates])
}

function handleOnFlyTo(setCoordinates, newPosition) {
  setCoordinates([newPosition[0],newPosition[1],newPosition[2]]);
  // const { current = {} } = mapRef;
  // const { leafletElement: map } = current;
  // const disneyLandLatLng = [33.8121, -117.9190];
  // map.flyTo(disneyLandLatLng, 14, {
  //   duration: 2
  // });
}

const ShipTypeField = () => {
  const record = useRecordContext();
  let typeName = "other"
  if (record.type == 7) typeName = "tanker"
  return <Chip 
      label={typeName}
      // color={colors[record.type-1]}
      style={{ backgroundColor: '#'+colors[record.type], color: 'white' }}
      />
}

const CustomField = ({setCoordnates, newPosition}) => {
  const record = useRecordContext();
  if (!record) return null;
  if (record.lat) return (<Button 
    variant="contained"
    size="small" 
    onClick={() => handleOnFlyTo(setCoordnates, [record.lat,record.lon])}>
      SHOW
      </Button>);
  return null;
    // <Chip
    //   // label={record.status}
    //   label="test"
    //   size="small"
    //   // color={
    //   //   record.status === "open"
    //   //     ? "primary"
    //   //     : record.status === "pending"
    //   //     ? "secondary"
    //   //     : "default"
    //   // }
    // />
}

const ShipList = props => {
    // const map = useMap();

  // const [selected, setSelected] = useState();

  //   function handleItemClick(index) {
  //     console.log(index)
  //     setSelected(8);
  //   }
    const [ coordinates, setCoordnates ] = useState(position);

    const classes = useStyles();
    const isSmall = useMediaQuery(theme => theme.breakpoints.down('sm'));

    const [pointsShow, setPointsShow] = useState([])

    useEffect(() => {
        fetchDataReal(setPointsShow, position[0], position[1], 8)
    },[])
  
    return (
        <Grid container aligment="stretch" spacing={1}>
            <Grid item md={5}>
                <button onClick={() => handleOnFlyTo(setCoordnates, newPosition)}>
                  Fly to Disneyland
                </button>
                <List
                    actions={null}
                    // actions={<ListActions/>}
                    bulkActionButtons={false}
                    perPage={15}
                    pagination={<Pagination  rowsPerPageOptions={[10, 15, 20]} />}
                    {...props}
                >
                    <Datagrid optimized>
                        {/* <TextField source="id" /> */}
                        {/* <SelectInput optionText="id" disabled /> */}
                        <TextField source="name" cellClassName={classes.title} />
                        <TextField source="flag" cellClassName={classes.flag} />
                        <ShipTypeField />
                        {/* <TextField source="type" cellClassName={classes.type} /> */}
                        {/* <TextField source="lat" cellClassName={classes.lat} />
                        <TextField source="lon" cellClassName={classes.lon} /> */}
                        <CustomField setCoordnates={setCoordnates} newPosition={newPosition}/>
                    </Datagrid>
                </List>
            </Grid>

            <Grid item md={7}>
                <MapContainer 
                    // style={{ height: "450px", width: "100%", flex: true }}
                    // ref={mapRef}
                    style={{ height: "90vh", width: "100%", flex: true }}
                    className="map-container"
                    preferCanvas
                    center={position}
                    zoom={6}
                >
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="OpenStreetMap">
                            <TileLayer
                                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>
                    <CoordinasesPosition coordinates={coordinates}/>
                    <MyMarkers data={pointsShow} />
                    <GetCoordinates eventChange={setPointsShow}/>
                </MapContainer>
            </Grid>
        </Grid>
    );
};

export default ShipList;
