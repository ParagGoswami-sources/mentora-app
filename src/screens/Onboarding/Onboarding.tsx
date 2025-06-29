import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  BackHandler,
  Animated,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import Page1 from "./Page1";
import Page2 from "./Page2";
import Page3 from "./Page3";

const { width } = Dimensions.get("window");

const Onboarding = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const scales = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  const goToPage = (pageIndex: number) => {
    scrollRef.current?.scrollTo({ x: pageIndex * width, animated: true });
    setCurrentPage(pageIndex);
    triggerDotAnimation(pageIndex);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (currentPage > 0) {
          goToPage(currentPage - 1);
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [currentPage]);

  const triggerDotAnimation = (index: number) => {
    Animated.sequence([
      Animated.timing(scales[index], {
        toValue: 1.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scales[index], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== currentPage) {
      setCurrentPage(newIndex);
      triggerDotAnimation(newIndex);
    }
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((index) => {
        const isActive = currentPage === index;
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: isActive ? "purple" : "#888",
                transform: [{ scale: scales[index] }],
                width: isActive ? 20 : 10,
                height: 10,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollRef}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        <View style={{ width }}>
          <Page1 onNext={() => goToPage(1)} />
        </View>
        <View style={{ width }}>
          <Page2 onNext={() => goToPage(2)} />
        </View>
        <View style={{ width }}>
          <Page3 onNext={() => {}} />
        </View>
      </ScrollView>

      {/* Dot Indicators */}
      {renderDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  dot: {
    borderRadius: 5,
    marginHorizontal: 5,
  },
});

export default Onboarding;
