import * as Progress from "react-native-progress";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
  GestureResponderEvent,
  Platform,
  Image,
} from "react-native";
import ImagePicker, { ImagePickerResponse } from "react-native-image-picker";
import storage from "@react-native-firebase/storage";
const { width } = Dimensions.get("window");

const IMAGE_SIZE = width / 3;
const MARGIN_VALUE = 1;

const options = {
  // TS: haha
  mediaType: "photo" as "photo",
  storageOptions: {
    skipBackup: true,
    path: "images",
    noData: true,
  },
};

function getRandomIntInclusive(min: number, max: number) {
  const minValue = Math.ceil(min);
  const maxValue = Math.floor(max);
  return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
}

export default function App() {
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  let task: any;

  const renderImageItem = () => {};

  useEffect(() => {
    storage()
      .ref("images")
      .listAll()
      .then((res) => {
        Promise.all(
          // @ts-ignore
          res.items.map((item) => storage().ref(item.path).getDownloadURL())
        ).then((res) => {
          setImages(res);
        });
      });
  }, []);

  const uploadImage = async (
    fileName: ImagePickerResponse["fileName"],
    path: ImagePickerResponse["path"]
  ) => {
    const ref = storage().ref(`images/${fileName}`);
    task = ref.putFile(`${path}`);
    task.on("state_changed", (taskSnapshot: any) => {
      setProgress(
        (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100
      );
    });

    task.then(async (props: { metadata: { fullPath: string } }) => {
      const newUrl: string = await storage()
        .ref(props.metadata.fullPath)
        .getDownloadURL();
      setImages([...images, newUrl]);
      setProgress(0);
    });
  };

  const handleImageAdd = () => {
    ImagePicker.showImagePicker(options, (response) => {
      // console.log("Response = ", response);

      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.error) {
        console.log("ImagePicker Error: ", response.error);
      } else if (response.customButton) {
        console.log("User tapped custom button: ", response.customButton);
      } else {
        let path = response.uri;
        if (!response.fileName) response.fileName = path.split("/").pop();
        uploadImage(response.fileName, path);
        // const source = { uri: response.uri };
        // You can also display the image using data:
        // const source = { uri: 'data:image/jpeg;base64,' + response.data };

        // this.setState({
        //   avatarSource: source,
        // });
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <AddFile
          isLoading={progress > 0}
          progress={progress}
          onPress={handleImageAdd}
        />
      </View>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={images}
        numColumns={~~(width / IMAGE_SIZE)}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{
              margin: MARGIN_VALUE,
              height: IMAGE_SIZE - MARGIN_VALUE * 2,
              width: IMAGE_SIZE - MARGIN_VALUE * 2,
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

function AddFile({
  isLoading,
  progress,
  onPress,
}: {
  isLoading: boolean;
  progress: number;
  onPress: () => void;
}) {
  return isLoading ? (
    <Progress.Circle showsText size={80} progress={progress} />
  ) : (
    <AddFileButton onPress={onPress} />
  );
}

function AddFileButton({
  onPress,
}: {
  onPress: (event: GestureResponderEvent) => void;
}) {
  return (
    <TouchableOpacity style={styles.addFileButton} onPress={onPress}>
      <Text style={styles.addFileText}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  addFileButton: {
    height: 80,
    width: 80,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "lightgrey",
    borderStyle: "dashed",
  },
  addFileText: {
    fontSize: 50,
    fontWeight: "200",
    lineHeight: 50,
    color: "lightgrey",
  },
});
