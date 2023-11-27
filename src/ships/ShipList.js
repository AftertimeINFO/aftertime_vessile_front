import React, { Children, Fragment, cloneElement, memo, useEffect, useState } from 'react';
import BookIcon from '@material-ui/icons/Book';
import { Grid } from '@mui/material'
import Chip from '@material-ui/core/Chip';
import { useMediaQuery, makeStyles } from '@material-ui/core';
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
    SearchInput,
    ShowButton,
    SimpleList,
    SingleFieldList,
    TextField,
    TextInput,
    useTranslate,
} from 'react-admin'; // eslint-disable-line import/no-unresolved

import ResetViewsButton from './ResetViewsButton';

import { useMap, MapContainer, TileLayer, GeoJSON, LayersControl, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "./styles.css";
import "leaflet/dist/leaflet.css";

export const PostIcon = BookIcon;

const colors = ["fe4848", "fe6c58", "fe9068", "feb478", "fed686"];

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
        iconSize: [40, 40],
        iconAnchor: [12, 24],
        popupAnchor: [7, -16],
        style: { transform: [{ rotate: '180deg' }] }
        });      
}

const MyMarkers = ({ data }) => {
    return data.map((item, index) => (
      <Marker
        key={index}
        icon={customMarkerIcon(colors[2], item.heading)}
        position={{ lat: item.lat, lng: item.lng }}
      >
        <Popup>{item.title}</Popup>
      </Marker>
    ));
};

async function fetchDataReal (setMethod, lat, lon, zoom) {
    fetch(`http://${process.env.REACT_APP_API_SERVER_FRONT}/api/v1/back/vehicle/map/ships?c_lat=${lat}&c_lon=${lon}&c_zoom=${zoom}`)
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

const position = [45.38, 29.68];

const ShipList = props => {
    const classes = useStyles();
    const isSmall = useMediaQuery(theme => theme.breakpoints.down('sm'));

    const [pointsShow, setPointsShow] = useState([])

    useEffect(() => {
        fetchDataReal(setPointsShow, position[0], position[1], 8)
    },[])
  
    return (
        <Grid container spacing={1}>
            <Grid item md={6}>
                <List
                    actions={null}
                    {...props}
                >
                    <Datagrid optimized>
                        <TextField source="id" />
                        <TextField source="name" cellClassName={classes.title} />
                    </Datagrid>
                </List>
            </Grid>

            <Grid item md={6}>
                <MapContainer 
                    style={{ height: "450px", width: "100%", flex: true }}
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
                    <MyMarkers data={pointsShow} />
                    <GetCoordinates eventChange={setPointsShow}/>
                </MapContainer>
            </Grid>
        </Grid>
    );
};

export default ShipList;
